"""Local-first Streamlit application for merging and OCR-processing PDFs."""

from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

import streamlit as st
from pypdf import PdfReader, PdfWriter
from streamlit_sortables import sort_items

try:
    import ocrmypdf

    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


st.set_page_config(page_title="PDF Merger", page_icon="📚", layout="wide")

st.markdown(
    """
    <style>
    div[data-testid="stButton"] > button,
    div[data-testid="stDownloadButton"] > button {
        background-color: #7c3aed !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        font-weight: 700 !important;
        height: 3rem !important;
    }

    div[data-testid="stButton"] > button:hover,
    div[data-testid="stDownloadButton"] > button:hover {
        background-color: #6d28d9 !important;
        color: white !important;
    }

    .upload-hint {
        background: linear-gradient(135deg, #3b0764, #4c1d95);
        border: 1px solid #8b5cf6;
        border-radius: 14px;
        box-shadow: 0 0 12px rgba(124, 58, 237, 0.35);
        color: #f5f3ff;
        font-size: 0.9rem;
        margin: 0.5rem 0 1rem;
        padding: 1rem;
        text-align: center;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


def format_size(size_bytes: int) -> str:
    """Return a human-readable file size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024**2:
        return f"{size_bytes / 1024:.1f} KB"
    if size_bytes < 1024**3:
        return f"{size_bytes / 1024**2:.1f} MB"
    return f"{size_bytes / 1024**3:.1f} GB"


def load_pdfs_from_folder(
    folder_path: str,
    recursive: bool = True,
) -> list[Path]:
    """Return PDF paths from a local folder."""
    folder = Path(os.path.expanduser(folder_path)).resolve()
    if not folder.is_dir():
        return []

    pattern = "**/*.pdf" if recursive else "*.pdf"
    return sorted(folder.glob(pattern), key=lambda path: str(path).lower())


def build_file_entries(source_files: list[Any]) -> list[dict[str, Any]]:
    """Normalize uploaded files and local paths for ordering and merging."""
    entries = []

    for index, item in enumerate(source_files):
        if hasattr(item, "getbuffer"):
            name = item.name
            size = item.size
            source_type = "upload"
            unique_part = getattr(item, "file_id", f"{index}_{name}")
        else:
            path = Path(item)
            name = path.name
            size = path.stat().st_size
            source_type = "folder"
            unique_part = str(path.resolve())

        entries.append(
            {
                "id": f"{index:04d}__{unique_part}",
                "label": f"{index + 1}. {name}",
                "file": item,
                "name": name,
                "size": size,
                "type": source_type,
            }
        )

    return entries


def run_ocr(
    input_path: Path,
    language_codes: list[str],
    output_dir: Path,
) -> Path:
    """Create a searchable OCR version of a PDF."""
    safe_name = input_path.stem.replace(" ", "_")
    output_path = output_dir / f"ocr_{safe_name}.pdf"

    ocrmypdf.ocr(
        input_file=str(input_path),
        output_file=str(output_path),
        language="+".join(language_codes),
        deskew=True,
        rotate_pages=True,
        skip_text=True,
        optimize=1,
    )
    return output_path


def sanitize_output_name(output_name: str) -> str:
    """Reduce an output name to a safe filename ending in .pdf."""
    safe_name = Path(output_name.strip()).name or "merged.pdf"
    if not safe_name.lower().endswith(".pdf"):
        safe_name += ".pdf"
    return safe_name


def merge_pdfs(
    ordered_entries: list[dict[str, Any]],
    output_name: str,
    add_bookmarks: bool = True,
    enable_ocr: bool = False,
    ocr_languages: list[str] | None = None,
) -> tuple[Path, int]:
    """Merge ordered PDF entries and return the output path and page count."""
    writer = PdfWriter()
    work_dir = Path(tempfile.mkdtemp(prefix="pdf_merger_"))
    output_path = Path(tempfile.gettempdir()) / sanitize_output_name(output_name)
    current_page = 0
    progress = st.progress(0)
    status = st.empty()

    try:
        for index, entry in enumerate(ordered_entries):
            status.write(f"Preparing: {entry['name']}")

            if entry["type"] == "upload":
                pdf_path = work_dir / f"input_{index:04d}.pdf"
                pdf_path.write_bytes(entry["file"].getbuffer())
            else:
                pdf_path = Path(entry["file"])

            if enable_ocr:
                status.write(f"Running OCR: {entry['name']}")
                try:
                    pdf_path = run_ocr(
                        input_path=pdf_path,
                        language_codes=ocr_languages or ["eng"],
                        output_dir=work_dir,
                    )
                except Exception as error:  # OCR failures should not stop merge.
                    st.warning(f"OCR skipped for {entry['name']}: {error}")

            status.write(f"Adding: {entry['name']}")
            reader = PdfReader(str(pdf_path))

            if reader.is_encrypted:
                raise ValueError(f"Encrypted PDF is not supported: {entry['name']}")

            if add_bookmarks:
                writer.add_outline_item(entry["name"], current_page)

            for page in reader.pages:
                writer.add_page(page)

            current_page += len(reader.pages)
            progress.progress((index + 1) / len(ordered_entries))

        with output_path.open("wb") as output_file:
            writer.write(output_file)
    finally:
        writer.close()
        shutil.rmtree(work_dir, ignore_errors=True)

    return output_path, current_page


if "folder_files" not in st.session_state:
    st.session_state.folder_files = []
if "merged_pdf_path" not in st.session_state:
    st.session_state.merged_pdf_path = None
if "merged_pdf_name" not in st.session_state:
    st.session_state.merged_pdf_name = None
if "total_pages" not in st.session_state:
    st.session_state.total_pages = None

st.title("📚 PDF Merger")
st.write(
    "Load PDF files, reorder them, and merge them locally into one document."
)

with st.sidebar:
    st.header("Source")
    source_mode = st.radio("Choose PDF source", ["Upload files", "Local folder"])
    uploaded_files = []
    folder_files = []

    if source_mode == "Upload files":
        st.markdown(
            '<div class="upload-hint"><b>Add PDF files</b><br>'
            "Your documents remain on this machine.</div>",
            unsafe_allow_html=True,
        )
        uploaded_files = st.file_uploader(
            "Add PDF files",
            type="pdf",
            accept_multiple_files=True,
        )
    else:
        st.markdown(
            '<div class="upload-hint"><b>Folder mode</b><br>'
            "Load PDFs from a trusted local directory.</div>",
            unsafe_allow_html=True,
        )
        folder_path = st.text_input("Local folder path", "~/Documents")
        recursive = st.checkbox("Include subfolders", value=True)

        if st.button("Load PDFs from folder", use_container_width=True):
            st.session_state.folder_files = load_pdfs_from_folder(
                folder_path,
                recursive,
            )

        folder_files = st.session_state.folder_files
        if folder_files:
            st.success(f"{len(folder_files)} PDF files found.")
        elif folder_path:
            st.info("Click 'Load PDFs from folder' to scan the folder.")

    st.divider()
    st.header("Options")
    output_name = st.text_input("Output file name", "merged_notes.pdf")
    add_bookmarks = st.checkbox(
        "Create PDF bookmarks from file names",
        value=True,
    )
    enable_ocr = st.checkbox(
        "Run OCR on scanned PDFs",
        value=False,
        disabled=not OCR_AVAILABLE,
    )

    if not OCR_AVAILABLE:
        st.warning("OCRmyPDF is not installed in the Python environment.")

    ocr_languages = st.multiselect(
        "OCR languages",
        ["eng", "fra"],
        default=["eng", "fra"],
        disabled=not enable_ocr,
    )

source_files = uploaded_files if source_mode == "Upload files" else folder_files
if not source_files:
    st.info("Add PDF files or load a local folder to get started.")
    st.stop()

file_entries = build_file_entries(source_files)
entry_by_label = {entry["label"]: entry for entry in file_entries}
total_size = sum(entry["size"] for entry in file_entries)

col1, col2, col3, col4 = st.columns(4)
col1.metric("Selected files", len(file_entries))
col2.metric("Total size", format_size(total_size))
col3.metric("PDF bookmarks", "Enabled" if add_bookmarks else "Disabled")
col4.metric("OCR", "Enabled" if enable_ocr else "Disabled")

st.subheader("File order")
action_col1, action_col2, action_col3 = st.columns([1, 1, 3])

with action_col1:
    merge_button = st.button(
        "Merge PDFs",
        type="primary",
        use_container_width=True,
    )

with action_col2:
    if st.session_state.merged_pdf_path:
        with open(st.session_state.merged_pdf_path, "rb") as final_pdf:
            st.download_button(
                label="Download PDF",
                data=final_pdf,
                file_name=st.session_state.merged_pdf_name,
                mime="application/pdf",
                type="primary",
                use_container_width=True,
            )

with action_col3:
    if st.session_state.total_pages:
        st.success(
            f"Last merge completed: {st.session_state.total_pages} pages."
        )

st.caption("Drag and drop the files to change the merge order.")
ordered_labels = sort_items(
    [entry["label"] for entry in file_entries],
    direction="vertical",
)
ordered_entries = [entry_by_label[label] for label in ordered_labels]

if merge_button:
    if enable_ocr and not ocr_languages:
        st.error("Select at least one OCR language.")
        st.stop()

    try:
        output_path, total_pages = merge_pdfs(
            ordered_entries=ordered_entries,
            output_name=output_name,
            add_bookmarks=add_bookmarks,
            enable_ocr=enable_ocr,
            ocr_languages=ocr_languages,
        )
    except Exception as error:
        st.error(f"Merge failed: {error}")
    else:
        st.session_state.merged_pdf_path = str(output_path)
        st.session_state.merged_pdf_name = output_path.name
        st.session_state.total_pages = total_pages
        st.rerun()

with st.expander("View final merge order", expanded=False):
    for index, entry in enumerate(ordered_entries, start=1):
        st.write(f"{index}. {entry['name']} — {format_size(entry['size'])}")

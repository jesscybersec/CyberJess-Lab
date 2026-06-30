"""HTML text extraction and target matching."""

from __future__ import annotations

from html.parser import HTMLParser
import re


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._in_title = False
        self.title = ""
        self.text_parts: list[str] = []
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "title":
            self._in_title = True
        if tag.lower() == "a":
            for name, value in attrs:
                if name.lower() == "href" and value:
                    self.links.append(value)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        clean = data.strip()
        if not clean:
            return
        if self._in_title:
            self.title += clean
        self.text_parts.append(clean)

    def text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self.text_parts)).strip()


def extract_text(html: str) -> tuple[str, str]:
    parser = TextExtractor()
    parser.feed(html)
    return parser.title.strip(), parser.text()


def extract_links(html: str) -> list[str]:
    parser = TextExtractor()
    parser.feed(html)
    return parser.links


def find_snippets(text: str, needle: str, radius: int) -> list[str]:
    if not needle:
        return []

    snippets = []
    pattern = re.compile(re.escape(needle), re.IGNORECASE)
    for match in pattern.finditer(text):
        start = max(match.start() - radius, 0)
        end = min(match.end() + radius, len(text))
        snippet = text[start:end].strip()
        if start > 0:
            snippet = f"...{snippet}"
        if end < len(text):
            snippet = f"{snippet}..."
        snippets.append(snippet)
    return snippets[:5]

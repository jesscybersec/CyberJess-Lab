---
name: ctf-writeup-publisher
description: Publish CyberJess Lab CTF walkthroughs from local notes into a GitHub-ready bilingual EN/FR format. Use when the user asks to publish, format, merge, rewrite, or prepare CTF walkthroughs/writeups for GitHub, especially TryHackMe rooms under ctf/thm, with README generation, cyberpunk/funny style, logo handling, flag redaction, Git verification, commit, and push on request.
---

# CTF Writeup Publisher

## Overview

Transform local CTF notes into a polished CyberJess Lab GitHub walkthrough. Produce a clean `README.md`, separate English and French walkthroughs, preserve original notes, redact flags, handle logos, and use Git carefully.

## Trigger Examples

Use this skill for requests like:

```text
Publish this THM walkthrough on my GitHub.
```

```text
Merge the MD files and format this like my other CTF walkthroughs.
```

```text
Create bilingual EN/FR cyberpunk CTF writeups for this local room folder.
```

## Expected Repository Pattern

Default TryHackMe path:

```text
ctf/thm/<room-slug>/
```

Expected final files:

```text
README.md
<RoomName>-EN.md
<RoomName>-FR.md
<RoomName>-Notes.md
<room-logo>.png
```

Keep the notes file if provided. Remove redundant index files such as `<RoomName>.md` when `README.md` already serves as the entry point.

## Workflow

1. Inspect the target room folder and list Markdown/image files.
2. Read the raw notes and at least one existing published walkthrough from the repo to match style.
3. Identify the room name, platform, link, attack path, tools, credentials path, privilege escalation path, and references.
4. Create or update `README.md`, `<RoomName>-EN.md`, and `<RoomName>-FR.md`.
5. Preserve or rename original notes as `<RoomName>-Notes.md` when appropriate.
6. Add the logo if present in the folder, using a relative path.
7. Redact real flags everywhere, including raw notes.
8. Verify links, logo references, duplicate files, and Git diff.
9. Commit and push only if the user asks.

## README Format

The README is the GitHub landing page. Include:

- Title: `# TryHackMe - <Room Name>`
- Centered logo if available
- TryHackMe room link
- Short `diff` block summarizing the attack path
- Language links to EN/FR
- Overview
- Objectives
- Repository contents
- Numbered attack path
- References

Logo pattern:

```html
<p align="center">
  <img src="./<logo-file>.png" alt="<Room Name> logo" width="240">
</p>
```

Use `width="240"` by default. Increase only if the image is naturally tiny. Avoid oversized logos.

## EN/FR Walkthrough Format

Use matching structures in both languages:

```text
# <Room Name> - Walkthrough

TryHackMe link
Centered logo
Atmospheric diff block

## Information / Informations
## Reconnaissance
## Enumeration / Enumération
## Exploitation or Credential Attack / Attaque sur les identifiants
## User Flag / Flag utilisateur
## Privilege Escalation / Escalade de privilèges
## Root Flag / Flag root
## Final Thoughts / Conclusion
## References / Références
```

Adapt headings to the actual room. Keep English and French semantically equivalent, but natural in each language.

## CyberJess Style

Write in a verbose but useful CTF teaching style:

- clear commands and outputs;
- interpretation after important findings;
- practical explanations for beginners;
- light cyberpunk/terminal tone;
- funny comments that do not obscure the attack path;
- no invented technical facts;
- no unnecessary marketing language.

Good style examples:

```text
The target basically handed us a username and a wordlist.
```

```text
GTFOBins becomes the cyberpunk spellbook.
```

```text
Le premier shell n'est pas la fin. C'est le hall d'entrée.
```

## Flag Redaction

Never publish real flags. Redact flags in every Markdown file, including raw notes.

Use:

```text
THM{REDACTED}
```

or:

```text
<REDACTED>
```

Before commit, search for common flag patterns:

```powershell
Select-String -Path *.md -Pattern 'THM\{|flag\{|HTB\{|picoCTF\{'
```

If a real flag appears, replace it before committing.

## Git Rules

Before staging:

```powershell
git status --short
git diff --stat
git diff
```

Stage only files for the requested CTF room or requested instruction file. Do not include unrelated untracked folders.

Suggested commit messages:

```text
Add <Room Name> THM walkthrough
Update <Room Name> walkthrough
Reduce <Room Name> logo size
Remove redundant <Room Name> index file
```

Push only when the user explicitly asks:

```powershell
git push origin main
```

## Final Checklist

Confirm:

- `README.md` exists and is the entry point.
- EN and FR walkthroughs exist.
- Notes are preserved when provided.
- Real flags are redacted.
- Logo path is relative and size is reasonable.
- No redundant index file remains.
- Links point to existing local files.
- Diff contains no unrelated changes.
- Commit and push were performed only when requested.

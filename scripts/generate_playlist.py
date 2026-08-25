#!/usr/bin/env python3
"""Scan music/ and write playlist.json with ASCII-safe playable copies."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

AUDIO_EXTENSIONS = {".mp3", ".ogg", ".wav", ".flac", ".m4a", ".aac", ".webm"}
ROOT = Path(__file__).resolve().parent.parent
MUSIC_DIR = ROOT / "music"
TRACKS_DIR = MUSIC_DIR / "tracks"
PLAYLIST_FILE = MUSIC_DIR / "playlist.json"


def collect_source_tracks() -> list[Path]:
    if not MUSIC_DIR.is_dir():
        return []

    return sorted(
        entry
        for entry in MUSIC_DIR.iterdir()
        if entry.is_file() and entry.suffix.lower() in AUDIO_EXTENSIONS
    )


def link_or_copy(src: Path, dest: Path) -> None:
    if dest.exists():
        dest.unlink()
    try:
        os_link = getattr(__import__("os"), "link")
        os_link(src, dest)
    except OSError:
        shutil.copy2(src, dest)


def main() -> None:
    sources = collect_source_tracks()
    TRACKS_DIR.mkdir(parents=True, exist_ok=True)

    playlist: list[dict[str, str]] = []
    keep_names: set[str] = set()

    for index, src in enumerate(sources, start=1):
        safe_name = f"{index:02d}{src.suffix.lower()}"
        keep_names.add(safe_name)
        dest = TRACKS_DIR / safe_name
        link_or_copy(src, dest)
        playlist.append(
            {
                "title": src.stem,
                "src": f"music/tracks/{safe_name}",
            }
        )

    for stale in TRACKS_DIR.iterdir():
        if stale.is_file() and stale.name not in keep_names:
            stale.unlink()

    PLAYLIST_FILE.write_text(
        json.dumps(playlist, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(playlist)} track(s) to {PLAYLIST_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

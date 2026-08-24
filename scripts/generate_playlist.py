#!/usr/bin/env python3
"""Scan music/ and write music/playlist.json for the web player."""

import json
from pathlib import Path

AUDIO_EXTENSIONS = {".mp3", ".ogg", ".wav", ".flac", ".m4a", ".aac", ".webm"}
ROOT = Path(__file__).resolve().parent.parent
MUSIC_DIR = ROOT / "music"
PLAYLIST_FILE = MUSIC_DIR / "playlist.json"


def collect_tracks() -> list[str]:
    if not MUSIC_DIR.is_dir():
        return []

    return sorted(
        entry.name
        for entry in MUSIC_DIR.iterdir()
        if entry.is_file()
        and entry.suffix.lower() in AUDIO_EXTENSIONS
        and entry.name != "playlist.json"
    )


def main() -> None:
    tracks = collect_tracks()
    PLAYLIST_FILE.write_text(
        json.dumps(tracks, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(tracks)} track(s) to {PLAYLIST_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

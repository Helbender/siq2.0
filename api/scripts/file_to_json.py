#!/usr/bin/env python3
"""Convert .1M files (base64-encoded JSON) to .json files in the same folder."""

from __future__ import annotations

import argparse
import base64
import json
import os


def decode_1m_file(path: str) -> dict:
    """Read a .1M file, base64-decode and parse as JSON."""
    with open(path, "rb") as f:
        raw = f.read()
    decoded = base64.b64decode(raw)
    return json.loads(decoded.decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert .1M files (base64-encoded JSON) to .json files."
    )
    parser.add_argument(
        "input_folder",
        type=str,
        help="Folder containing .1M files; JSON files are written to the same folder.",
    )
    args = parser.parse_args()

    input_folder = os.path.abspath(args.input_folder)
    if not os.path.isdir(input_folder):
        parser.error(f"Not a directory: {input_folder}")

    count = 0
    for name in os.listdir(input_folder):
        if not name.lower().endswith(".1m"):
            continue
        path = os.path.join(input_folder, name)
        if not os.path.isfile(path):
            continue
        base_name = name[:-4]  # strip .1M
        out_name = f"{base_name}.json"
        out_path = os.path.join(input_folder, out_name)
        try:
            data = decode_1m_file(path)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {name} -> {out_name}")
            count += 1
        except Exception as e:
            print(f"  SKIP {name}: {e}")

    print(f"Done. Wrote {count} JSON file(s) to {input_folder}")


if __name__ == "__main__":
    main()

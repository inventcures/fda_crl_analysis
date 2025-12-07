#!/usr/bin/env python3
"""
Prepare PDFs for web deployment by copying and renaming them by file_hash.

This ensures PDFs can be accessed via /pdfs/{file_hash}.pdf URL structure.
"""

import json
import shutil
from pathlib import Path

def prepare_pdfs(parsed_data_path: str, output_dir: str):
    """Copy and rename PDFs by file_hash for web access."""

    # Load parsed data to get file_hash mappings
    with open(parsed_data_path) as f:
        data = json.load(f)

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    copied = 0
    skipped = 0
    for doc in data:
        file_hash = doc.get('file_hash')
        original_path = Path(doc.get('file_path'))

        if not original_path.exists():
            print(f"⚠ PDF not found: {original_path}")
            skipped += 1
            continue

        # Copy to output directory with file_hash as name
        dest_path = output_path / f"{file_hash}.pdf"
        shutil.copy2(original_path, dest_path)
        copied += 1

        if copied % 50 == 0:
            print(f"Copied {copied} PDFs...")

    print(f"\n✓ Copied {copied} PDFs to {output_dir}")
    if skipped > 0:
        print(f"  ⚠ Skipped {skipped} PDFs (not found)")

    # Calculate total size
    total_size = sum(f.stat().st_size for f in output_path.glob('*.pdf'))
    print(f"  Total size: {total_size / (1024 * 1024):.1f}MB")

    return copied

if __name__ == '__main__':
    prepare_pdfs(
        parsed_data_path='data/processed/parsed_crls.json',
        output_dir='website/public/pdfs'
    )

#!/usr/bin/env python3
"""
Generate document embeddings for hybrid search.

Uses sentence-transformers with all-MiniLM-L6-v2 model (same as transformers.js)
to generate 384-dimensional embeddings for each CRL document.

Usage:
    pip install sentence-transformers
    python scripts/generate_embeddings.py
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Please install sentence-transformers: pip install sentence-transformers")
    exit(1)


def create_embedding_text(doc: Dict[str, Any]) -> str:
    """Create text for embedding from document fields."""
    parts = []

    # Drug and application info
    if doc.get('drug_name'):
        parts.append(f"Drug: {doc['drug_name']}")
    if doc.get('application_number'):
        parts.append(f"Application: {doc['application_number']}")
    if doc.get('sponsor_name'):
        parts.append(f"Sponsor: {doc['sponsor_name']}")
    if doc.get('therapeutic_area') and doc['therapeutic_area'] != 'unknown':
        parts.append(f"Area: {doc['therapeutic_area']}")

    # Deficiency categories
    categories = doc.get('deficiency_categories', [])
    if categories:
        parts.append(f"Issues: {', '.join(categories)}")

    # Deficiencies text (if available)
    if doc.get('deficiencies_text'):
        parts.append(doc['deficiencies_text'][:500])
    elif doc.get('raw_text'):
        # Use first 500 chars of raw text
        parts.append(doc['raw_text'][:500])

    return ". ".join(parts)


def main():
    # Paths
    project_root = Path(__file__).parent.parent
    search_data_path = project_root / "website" / "public" / "data" / "search_crls.json"
    output_path = project_root / "website" / "public" / "data" / "embeddings.json"

    # Check input exists
    if not search_data_path.exists():
        print(f"Error: {search_data_path} not found")
        exit(1)

    print(f"Loading documents from {search_data_path}...")
    with open(search_data_path, 'r') as f:
        documents = json.load(f)

    print(f"Found {len(documents)} documents")

    # Initialize model (same as transformers.js uses)
    print("Loading model: all-MiniLM-L6-v2...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Generate embeddings
    print("Generating embeddings...")
    embeddings = {}

    for i, doc in enumerate(documents):
        file_hash = doc.get('file_hash')
        if not file_hash:
            continue

        # Create text for embedding
        text = create_embedding_text(doc)

        # Generate embedding
        embedding = model.encode(text, normalize_embeddings=True)
        embeddings[file_hash] = embedding.tolist()

        if (i + 1) % 50 == 0:
            print(f"  Processed {i + 1}/{len(documents)} documents")

    print(f"Generated {len(embeddings)} embeddings")

    # Save embeddings
    print(f"Saving to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(embeddings, f)

    # Report file size
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Done! Output file size: {size_mb:.2f} MB")


if __name__ == "__main__":
    main()

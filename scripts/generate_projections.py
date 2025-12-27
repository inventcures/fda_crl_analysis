#!/usr/bin/env python3
"""
Generate t-SNE and UMAP 2D projections from document embeddings.
Outputs a JSON file with coordinates and metadata for the interactive explorer.
"""

import json
import numpy as np
from pathlib import Path
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
import warnings

# Try to import UMAP, fall back gracefully
try:
    from umap import UMAP
    HAS_UMAP = True
except ImportError:
    HAS_UMAP = False
    print("Warning: UMAP not installed. Will only generate t-SNE projections.")

def main():
    # Paths
    base_path = Path(__file__).parent.parent / "website" / "public" / "data"
    embeddings_path = base_path / "embeddings.json"
    enriched_path = base_path / "enriched_crls.json"
    output_path = base_path / "embedding_projections.json"

    print(f"Loading embeddings from {embeddings_path}...")
    with open(embeddings_path, 'r') as f:
        embeddings_raw = json.load(f)

    print(f"Loading document metadata from {enriched_path}...")
    with open(enriched_path, 'r') as f:
        enriched_docs = json.load(f)

    # Create lookup from file_hash to doc info
    doc_lookup = {doc['file_hash']: doc for doc in enriched_docs}

    # Get file hashes that exist in both embeddings and metadata
    valid_hashes = [h for h in embeddings_raw.keys() if h in doc_lookup]
    print(f"Found {len(valid_hashes)} documents with both embeddings and metadata")

    # Build embedding matrix
    embedding_matrix = np.array([embeddings_raw[h] for h in valid_hashes])
    print(f"Embedding matrix shape: {embedding_matrix.shape}")

    # Generate t-SNE projection
    print("Generating t-SNE projection...")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        tsne = TSNE(
            n_components=2,
            perplexity=min(30, len(valid_hashes) - 1),
            random_state=42,
            max_iter=1000,
            init='pca'
        )
        tsne_coords = tsne.fit_transform(embedding_matrix)
    print(f"t-SNE complete. Shape: {tsne_coords.shape}")

    # Generate UMAP projection
    if HAS_UMAP:
        print("Generating UMAP projection...")
        umap = UMAP(
            n_components=2,
            n_neighbors=min(15, len(valid_hashes) - 1),
            min_dist=0.1,
            random_state=42
        )
        umap_coords = umap.fit_transform(embedding_matrix)
        print(f"UMAP complete. Shape: {umap_coords.shape}")
    else:
        # Fall back to t-SNE with different perplexity as pseudo-UMAP
        print("Generating pseudo-UMAP (t-SNE with different params)...")
        umap_tsne = TSNE(
            n_components=2,
            perplexity=min(50, len(valid_hashes) - 1),
            random_state=123,
            max_iter=1000,
            init='pca'
        )
        umap_coords = umap_tsne.fit_transform(embedding_matrix)

    # Generate cluster labels (K-Means with k=5)
    print("Generating cluster labels...")
    n_clusters = min(5, len(valid_hashes))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(embedding_matrix)

    # Calculate severity scores (simple proxy based on deficiency count)
    def calc_severity(doc):
        cats = doc.get('deficiency_categories', [])
        if isinstance(cats, list):
            return min(len(cats) / 5.0, 1.0)  # Normalize to 0-1
        return 0.5

    # Build output data
    print("Building output data...")
    output_data = {
        "points": [],
        "metadata": {
            "total_documents": len(valid_hashes),
            "clusters": n_clusters,
            "therapeutic_areas": list(set(doc_lookup[h].get('therapeutic_area', 'unknown') for h in valid_hashes)),
            "has_umap": HAS_UMAP
        }
    }

    for i, file_hash in enumerate(valid_hashes):
        doc = doc_lookup[file_hash]

        point = {
            "file_hash": file_hash,
            "drug_name": doc.get('drug_name', 'Unknown'),
            "application_number": doc.get('application_number', ''),
            "approval_status": doc.get('approval_status', 'unknown'),
            "therapeutic_area": doc.get('therapeutic_area', 'unknown'),
            "deficiency_categories": doc.get('deficiency_categories', []),
            "letter_date": doc.get('letter_date', ''),
            "tsne_x": float(tsne_coords[i, 0]),
            "tsne_y": float(tsne_coords[i, 1]),
            "umap_x": float(umap_coords[i, 0]),
            "umap_y": float(umap_coords[i, 1]),
            "cluster": int(cluster_labels[i]),
            "severity_score": calc_severity(doc)
        }
        output_data["points"].append(point)

    # Save output
    print(f"Saving to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)

    print(f"Done! Generated projections for {len(valid_hashes)} documents.")
    print(f"Output file: {output_path}")

    # Print some stats
    approved_count = sum(1 for p in output_data["points"] if p["approval_status"] == "approved")
    unapproved_count = len(output_data["points"]) - approved_count
    print(f"\nStats: {approved_count} approved, {unapproved_count} unapproved")
    print(f"Therapeutic areas: {output_data['metadata']['therapeutic_areas']}")

if __name__ == "__main__":
    main()

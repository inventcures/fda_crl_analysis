#!/usr/bin/env python3
"""Generate n-gram frequency data for interactive visualization from enriched CRLs."""

import json
import re
from collections import Counter
from pathlib import Path

# FDA-specific stop words to filter out common but uninteresting terms
STOP_WORDS = {
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
    'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
    'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
    'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
    'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
    'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
    'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
    'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
    'any', 'these', 'give', 'day', 'most', 'us', 'has', 'had', 'is', 'are', 'was',
    'were', 'been', 'being', 'have', 'has', 'had', 'does', 'did', 'shall', 'should',
    'may', 'might', 'must', 'need', 'used', 'using', 'including', 'such', 'each',
    'through', 'during', 'before', 'between', 'under', 'within', 'without', 'against',
    'following', 'however', 'therefore', 'thus', 'upon', 'above', 'below', 'both',
    'either', 'neither', 'whether', 'while', 'although', 'though', 'once', 'unless',
    'until', 'since', 'where', 'why', 'here', 'found', 'based', 'per', 'received',
    'provided', 'submitted', 'included', 'noted', 'stated', 'requested', 'required',
    # FDA document specific
    'section', 'page', 'reference', 'letter', 'response', 'complete', 'application',
    'drug', 'product', 'please', 'review', 'see', 'refer', 'note', 'date', 'number',
    'attachment', 'enclosure', 'amendment', 'supplement', 'submission', 'information',
    'data', 'additional', 'regarding', 'concerning', 'related', 'associated', 'described',
    # Technical noise
    'cid', 'www', 'fda', 'gov', 'http', 'https', 'pdf', 'com', 'org', 'html',
    'food', 'administration', 'silver', 'spring', 'maryland', 'rockville', 'pike',
    'new', 'hampshire', 'avenue', 'office', 'center', 'evaluation', 'research',
    'drugs', 'biologics', 'devices', 'document', 'documents'
}

# N-gram stop patterns (phrases to exclude)
NGRAM_STOP_PATTERNS = [
    r'^please (refer|see|note)',
    r'^(the|a|an) (the|a|an)',
    r'^\d+ \d+',
    r'^section \d+',
]


def clean_text(text):
    """Clean and normalize text for n-gram extraction."""
    # Remove special characters but keep alphanumeric and spaces
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def extract_ngrams(text, n=2, min_count=2):
    """Extract n-grams from text."""
    words = clean_text(text).split()
    # Filter out stop words and short words
    words = [w for w in words if w not in STOP_WORDS and len(w) > 2 and not w.isdigit()]

    ngrams = []
    for i in range(len(words) - n + 1):
        ngram = ' '.join(words[i:i+n])
        # Skip if matches stop pattern
        if not any(re.match(pattern, ngram) for pattern in NGRAM_STOP_PATTERNS):
            ngrams.append(ngram)

    return ngrams


def main():
    # Load enriched CRLs
    enriched_path = Path(__file__).parent.parent / 'public' / 'data' / 'enriched_crls.json'

    with open(enriched_path, 'r') as f:
        crls = json.load(f)

    print(f"Loaded {len(crls)} CRLs")

    # Separate by approval status
    approved_texts = []
    unapproved_texts = []

    for crl in crls:
        text = crl.get('raw_text', '') or ''
        if len(text) < 100:
            continue

        if crl.get('approval_status') == 'approved':
            approved_texts.append(text)
        else:
            unapproved_texts.append(text)

    print(f"Approved CRLs with text: {len(approved_texts)}")
    print(f"Unapproved CRLs with text: {len(unapproved_texts)}")

    # Extract n-grams for each group
    result = {
        'bigrams': {
            'approved': [],
            'unapproved': [],
            'comparative': []
        },
        'trigrams': {
            'approved': [],
            'unapproved': [],
            'comparative': []
        }
    }

    for n, key in [(2, 'bigrams'), (3, 'trigrams')]:
        # Extract from approved
        approved_ngrams = []
        for text in approved_texts:
            approved_ngrams.extend(extract_ngrams(text, n=n))
        approved_counts = Counter(approved_ngrams)

        # Extract from unapproved
        unapproved_ngrams = []
        for text in unapproved_texts:
            unapproved_ngrams.extend(extract_ngrams(text, n=n))
        unapproved_counts = Counter(unapproved_ngrams)

        # Normalize counts by document count
        approved_doc_count = len(approved_texts)
        unapproved_doc_count = len(unapproved_texts)

        # Get top n-grams for approved (minimum 3 occurrences)
        top_approved = [(ngram, count) for ngram, count in approved_counts.most_common(50) if count >= 3]
        result[key]['approved'] = [{'text': ngram, 'count': count} for ngram, count in top_approved[:25]]

        # Get top n-grams for unapproved
        top_unapproved = [(ngram, count) for ngram, count in unapproved_counts.most_common(50) if count >= 3]
        result[key]['unapproved'] = [{'text': ngram, 'count': count} for ngram, count in top_unapproved[:25]]

        # Calculate comparative (which n-grams are more distinctive)
        all_ngrams = set(approved_counts.keys()) | set(unapproved_counts.keys())
        comparative = []

        for ngram in all_ngrams:
            approved_norm = (approved_counts.get(ngram, 0) / approved_doc_count) if approved_doc_count > 0 else 0
            unapproved_norm = (unapproved_counts.get(ngram, 0) / unapproved_doc_count) if unapproved_doc_count > 0 else 0

            total = approved_counts.get(ngram, 0) + unapproved_counts.get(ngram, 0)
            if total >= 5:  # Minimum total occurrences for comparative
                diff = approved_norm - unapproved_norm
                comparative.append({
                    'text': ngram,
                    'approved_count': approved_counts.get(ngram, 0),
                    'unapproved_count': unapproved_counts.get(ngram, 0),
                    'approved_normalized': round(approved_norm, 4),
                    'unapproved_normalized': round(unapproved_norm, 4),
                    'difference': round(diff, 4),
                    'total': total
                })

        # Sort by absolute difference
        comparative.sort(key=lambda x: abs(x['difference']), reverse=True)
        result[key]['comparative'] = comparative[:30]

        print(f"\n{key.title()}:")
        print(f"  Approved unique: {len(approved_counts)}")
        print(f"  Unapproved unique: {len(unapproved_counts)}")
        print(f"  Top approved: {result[key]['approved'][:3]}")
        print(f"  Top unapproved: {result[key]['unapproved'][:3]}")

    # Add statistics
    result['stats'] = {
        'approved_documents': len(approved_texts),
        'unapproved_documents': len(unapproved_texts)
    }

    # Save to public/data
    output_path = Path(__file__).parent.parent / 'public' / 'data' / 'ngram_data.json'
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\nSaved n-gram data to {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")


if __name__ == '__main__':
    main()

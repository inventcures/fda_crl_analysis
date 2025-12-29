#!/usr/bin/env python3
"""Generate topic model and sentiment trajectory data for interactive visualization."""

import json
import re
import numpy as np
from collections import Counter
from pathlib import Path

# Try to import sklearn for LDA
try:
    from sklearn.feature_extraction.text import CountVectorizer
    from sklearn.decomposition import LatentDirichletAllocation
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("Warning: sklearn not available, topic modeling will be limited")

# Try to import textblob for sentiment
try:
    from textblob import TextBlob
    HAS_TEXTBLOB = True
except ImportError:
    HAS_TEXTBLOB = False
    print("Warning: textblob not available, using lexicon-based sentiment")

# Severity lexicon for fallback sentiment
SEVERITY_LEXICON = {
    'cannot determine': 0.95, 'serious concern': 0.9, 'major deficiency': 0.9,
    'significant deficiency': 0.85, 'inadequate': 0.8, 'unacceptable': 0.85,
    'critical': 0.9, 'failed': 0.75, 'not adequate': 0.75, 'insufficient': 0.7,
    'lacking': 0.65, 'deficient': 0.65, 'incomplete': 0.55, 'unclear': 0.45,
    'not provided': 0.55, 'recommend': 0.4, 'suggest': 0.35, 'consider': 0.3,
    'minor': 0.25, 'administrative': 0.2, 'labeling': 0.2,
}

# Positive/negative word lists for simple sentiment
POSITIVE_WORDS = {
    'acceptable', 'adequate', 'appropriate', 'approved', 'complete', 'compliant',
    'comprehensive', 'confirmed', 'effective', 'favorable', 'good', 'positive',
    'proper', 'reasonable', 'satisfactory', 'sufficient', 'suitable', 'support',
    'valid', 'well'
}

NEGATIVE_WORDS = {
    'adverse', 'concern', 'deficient', 'failure', 'inadequate', 'incomplete',
    'insufficient', 'lacking', 'missing', 'not', 'problem', 'reject', 'serious',
    'unable', 'unacceptable', 'unclear', 'unsatisfactory', 'warning'
}


def clean_text(text):
    """Clean text for processing."""
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def get_sentences(text):
    """Split text into sentences."""
    # Simple sentence splitting
    sentences = re.split(r'[.!?]+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def calculate_sentence_sentiment(sentence):
    """Calculate sentiment for a single sentence."""
    if HAS_TEXTBLOB:
        blob = TextBlob(sentence)
        return {
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity
        }
    else:
        # Fallback: simple word-based sentiment
        words = set(clean_text(sentence).split())
        pos_count = len(words & POSITIVE_WORDS)
        neg_count = len(words & NEGATIVE_WORDS)
        total = pos_count + neg_count
        if total == 0:
            polarity = 0
        else:
            polarity = (pos_count - neg_count) / total
        return {
            'polarity': polarity,
            'subjectivity': 0.5  # Default when no TextBlob
        }


def calculate_severity_score(sentence):
    """Calculate severity score for a sentence."""
    text_lower = sentence.lower()
    total_weight = 0
    total_count = 0
    for phrase, weight in SEVERITY_LEXICON.items():
        count = text_lower.count(phrase)
        if count > 0:
            total_weight += weight * count
            total_count += count
    return total_weight / max(total_count, 1) if total_count > 0 else 0.3


def smooth(data, window=3):
    """Apply rolling average smoothing."""
    if len(data) < window:
        return data
    return np.convolve(data, np.ones(window)/window, mode='valid').tolist()


def generate_sentiment_trajectory(text, doc_id, approval_status):
    """Generate sentiment trajectory data for a document."""
    sentences = get_sentences(text)
    if len(sentences) < 10:
        return None

    trajectory = {
        'doc_id': doc_id,
        'approval_status': approval_status,
        'sentence_count': len(sentences),
        'data': []
    }

    polarities = []
    subjectivities = []
    severities = []

    for i, sent in enumerate(sentences):
        sentiment = calculate_sentence_sentiment(sent)
        severity = calculate_severity_score(sent)

        polarities.append(sentiment['polarity'])
        subjectivities.append(sentiment['subjectivity'])
        severities.append(severity)

        trajectory['data'].append({
            'position': i,
            'polarity': round(sentiment['polarity'], 3),
            'subjectivity': round(sentiment['subjectivity'], 3),
            'severity': round(severity, 3),
        })

    # Add smoothed versions
    trajectory['smoothed'] = {
        'polarity': [round(x, 3) for x in smooth(polarities, 5)],
        'subjectivity': [round(x, 3) for x in smooth(subjectivities, 5)],
        'severity': [round(x, 3) for x in smooth(severities, 5)],
    }

    # Summary stats
    trajectory['summary'] = {
        'mean_polarity': round(np.mean(polarities), 3),
        'mean_subjectivity': round(np.mean(subjectivities), 3),
        'mean_severity': round(np.mean(severities), 3),
        'polarity_trend': round(np.mean(polarities[-5:]) - np.mean(polarities[:5]), 3) if len(polarities) >= 10 else 0,
    }

    return trajectory


def generate_topic_model(documents, n_topics=5):
    """Generate LDA topic model data."""
    if not HAS_SKLEARN:
        # Return placeholder data
        return {
            'topics': [
                {'id': i, 'words': ['word1', 'word2', 'word3'], 'weight': 0.2}
                for i in range(n_topics)
            ],
            'document_topics': {'approved': [0.2]*n_topics, 'unapproved': [0.2]*n_topics}
        }

    valid_docs = [d for d in documents if d.get('raw_text') and len(d.get('raw_text', '')) > 100]
    texts = [clean_text(d['raw_text']) for d in valid_docs]
    labels = [d['approval_status'] for d in valid_docs]

    # Create count vectors for LDA
    vectorizer = CountVectorizer(
        max_features=1000,
        stop_words='english',
        min_df=2,
        max_df=0.95
    )
    doc_term_matrix = vectorizer.fit_transform(texts)

    # LDA
    lda = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        max_iter=20
    )
    doc_topics = lda.fit_transform(doc_term_matrix)

    # Get top words per topic
    feature_names = vectorizer.get_feature_names_out()
    topics = []
    for i, topic in enumerate(lda.components_):
        top_indices = topic.argsort()[-10:][::-1]
        top_words = [
            {'word': feature_names[idx], 'weight': round(float(topic[idx]), 4)}
            for idx in top_indices
        ]
        topics.append({
            'id': i,
            'label': f'Topic {i + 1}',
            'words': top_words
        })

    # Calculate average topic distribution by approval status
    labels_array = np.array(labels)
    approved_mask = labels_array == 'approved'

    approved_topics = doc_topics[approved_mask].mean(axis=0).tolist()
    unapproved_topics = doc_topics[~approved_mask].mean(axis=0).tolist()

    document_topics = {
        'approved': [round(x, 4) for x in approved_topics],
        'unapproved': [round(x, 4) for x in unapproved_topics]
    }

    # Topic differences
    topic_differences = []
    for i in range(n_topics):
        diff = approved_topics[i] - unapproved_topics[i]
        topic_differences.append({
            'topic_id': i,
            'label': f'Topic {i + 1}',
            'approved_weight': round(approved_topics[i], 4),
            'unapproved_weight': round(unapproved_topics[i], 4),
            'difference': round(diff, 4),
            'top_words': [w['word'] for w in topics[i]['words'][:5]]
        })

    return {
        'topics': topics,
        'document_topics': document_topics,
        'topic_differences': topic_differences,
        'stats': {
            'n_documents': len(valid_docs),
            'n_approved': int(np.sum(approved_mask)),
            'n_unapproved': int(np.sum(~approved_mask)),
            'n_topics': n_topics
        }
    }


def main():
    # Load enriched CRLs
    enriched_path = Path(__file__).parent.parent / 'public' / 'data' / 'enriched_crls.json'

    with open(enriched_path, 'r') as f:
        crls = json.load(f)

    print(f"Loaded {len(crls)} CRLs")

    # Generate topic model
    print("\n1. Generating topic model...")
    topic_data = generate_topic_model(crls, n_topics=5)
    print(f"   Generated {len(topic_data['topics'])} topics")
    for topic in topic_data['topic_differences']:
        print(f"   {topic['label']}: {', '.join(topic['top_words'])}")

    # Generate sentiment trajectories for sample documents
    print("\n2. Generating sentiment trajectories...")
    trajectories = []

    # Get a mix of approved and unapproved documents
    approved_docs = [c for c in crls if c.get('approval_status') == 'approved' and c.get('raw_text') and len(c.get('raw_text', '')) > 500]
    unapproved_docs = [c for c in crls if c.get('approval_status') == 'unapproved' and c.get('raw_text') and len(c.get('raw_text', '')) > 500]

    print(f"   Found {len(approved_docs)} approved and {len(unapproved_docs)} unapproved docs with text")

    # Sample up to 5 from each
    for docs, status in [(approved_docs[:5], 'approved'), (unapproved_docs[:5], 'unapproved')]:
        for doc in docs:
            traj = generate_sentiment_trajectory(
                doc['raw_text'],
                doc.get('file_hash', 'unknown'),
                status
            )
            if traj:
                # Add drug name if available
                traj['drug_name'] = doc.get('drug_name', 'Unknown Drug')
                trajectories.append(traj)
                print(f"   Added trajectory for {traj['drug_name']} ({status})")

    # Calculate aggregate sentiment by approval status
    approved_trajectories = [t for t in trajectories if t['approval_status'] == 'approved']
    unapproved_trajectories = [t for t in trajectories if t['approval_status'] == 'unapproved']

    aggregate = {
        'approved': {
            'mean_polarity': round(np.mean([t['summary']['mean_polarity'] for t in approved_trajectories]), 3) if approved_trajectories else 0,
            'mean_severity': round(np.mean([t['summary']['mean_severity'] for t in approved_trajectories]), 3) if approved_trajectories else 0,
            'count': len(approved_trajectories)
        },
        'unapproved': {
            'mean_polarity': round(np.mean([t['summary']['mean_polarity'] for t in unapproved_trajectories]), 3) if unapproved_trajectories else 0,
            'mean_severity': round(np.mean([t['summary']['mean_severity'] for t in unapproved_trajectories]), 3) if unapproved_trajectories else 0,
            'count': len(unapproved_trajectories)
        }
    }

    # Combine results
    result = {
        'topic_model': topic_data,
        'sentiment_trajectories': trajectories,
        'sentiment_aggregate': aggregate
    }

    # Save to public/data
    output_path = Path(__file__).parent.parent / 'public' / 'data' / 'topic_sentiment_data.json'
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\nSaved topic/sentiment data to {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")


if __name__ == '__main__':
    main()

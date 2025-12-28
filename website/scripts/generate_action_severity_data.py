#!/usr/bin/env python3
"""Generate action type and severity data for interactive visualization."""

import json
import re
from collections import defaultdict
from pathlib import Path

# Action lexicon from language_analysis.py
ACTION_LEXICON = {
    'new clinical trial': 'major_study',
    'additional study': 'major_study',
    'confirmatory trial': 'major_study',
    'phase 3': 'major_study',
    'new study': 'major_study',

    'additional data': 'data_request',
    'provide data': 'data_request',
    'submit data': 'data_request',
    'analysis': 'data_request',

    'inspection': 'facility_action',
    'facility': 'facility_action',
    'manufacturing': 'facility_action',
    'cgmp': 'facility_action',
    'cmc': 'facility_action',

    'revise labeling': 'labeling',
    'update label': 'labeling',
    'prescribing information': 'labeling',
    'medication guide': 'labeling',

    'rems': 'risk_management',
    'risk evaluation': 'risk_management',
    'mitigation strategy': 'risk_management',

    # Oncology-specific
    'long-term follow-up data': 'data_request',
    'toxicity monitoring': 'data_request',
    'dose optimization': 'data_request',
    'biomarker validation': 'major_study',
    'expanded trial population': 'major_study',
    'cardiac monitoring': 'risk_management',
}

# Severity lexicon from language_analysis.py
SEVERITY_LEXICON = {
    'cannot determine': 0.95,
    'serious concern': 0.9,
    'major deficiency': 0.9,
    'significant deficiency': 0.85,
    'inadequate': 0.8,
    'unacceptable': 0.85,
    'critical': 0.9,
    'failed': 0.75,
    'not adequate': 0.75,
    'insufficient': 0.7,
    'lacking': 0.65,
    'deficient': 0.65,
    'incomplete': 0.55,
    'unclear': 0.45,
    'not provided': 0.55,
    'recommend': 0.4,
    'suggest': 0.35,
    'consider': 0.3,
    'minor': 0.25,
    'administrative': 0.2,
    'labeling': 0.2,
}

ACTION_TYPE_LABELS = {
    'major_study': 'Major Study',
    'data_request': 'Data Request',
    'facility_action': 'Facility Action',
    'labeling': 'Labeling',
    'risk_management': 'Risk Management',
}


def extract_action_types(text):
    """Extract action types from text."""
    text_lower = text.lower()
    actions = defaultdict(int)
    for phrase, action_type in ACTION_LEXICON.items():
        actions[action_type] += text_lower.count(phrase)
    return dict(actions)


def calculate_severity_score(text):
    """Calculate severity score from text using lexicon."""
    text_lower = text.lower()
    total_weight = 0
    total_count = 0

    for phrase, weight in SEVERITY_LEXICON.items():
        count = text_lower.count(phrase)
        if count > 0:
            total_weight += weight * count
            total_count += count

    return total_weight / max(total_count, 1)


def main():
    # Load enriched CRLs
    enriched_path = Path(__file__).parent.parent / 'public' / 'data' / 'enriched_crls.json'

    with open(enriched_path, 'r') as f:
        crls = json.load(f)

    print(f"Loaded {len(crls)} CRLs")

    # Separate by approval status
    approved_data = {'actions': defaultdict(list), 'severity': []}
    unapproved_data = {'actions': defaultdict(list), 'severity': []}

    for crl in crls:
        text = crl.get('raw_text', '') or ''
        if len(text) < 100:
            continue

        actions = extract_action_types(text)
        severity = calculate_severity_score(text)

        target = approved_data if crl.get('approval_status') == 'approved' else unapproved_data

        for action_type, count in actions.items():
            target['actions'][action_type].append(count)

        target['severity'].append(severity)

    # Calculate action statistics
    action_data = []
    all_action_types = set(ACTION_TYPE_LABELS.keys())

    for action_type in all_action_types:
        approved_counts = approved_data['actions'].get(action_type, [0])
        unapproved_counts = unapproved_data['actions'].get(action_type, [0])

        # Calculate mean per document
        approved_mean = sum(approved_counts) / max(len(approved_data['severity']), 1)
        unapproved_mean = sum(unapproved_counts) / max(len(unapproved_data['severity']), 1)

        action_data.append({
            'action_type': action_type,
            'label': ACTION_TYPE_LABELS[action_type],
            'approved_mean': round(approved_mean, 2),
            'unapproved_mean': round(unapproved_mean, 2),
            'approved_total': sum(approved_counts),
            'unapproved_total': sum(unapproved_counts),
            'difference': round(approved_mean - unapproved_mean, 2),
        })

    # Sort by total occurrence
    action_data.sort(key=lambda x: x['approved_total'] + x['unapproved_total'], reverse=True)

    # Calculate severity distribution
    def bucket_severity(scores, num_buckets=10):
        """Bucket severity scores into histogram."""
        buckets = [0] * num_buckets
        for score in scores:
            bucket_idx = min(int(score * num_buckets), num_buckets - 1)
            buckets[bucket_idx] += 1
        return buckets

    approved_severity_buckets = bucket_severity(approved_data['severity'])
    unapproved_severity_buckets = bucket_severity(unapproved_data['severity'])

    severity_histogram = []
    for i in range(10):
        range_start = i / 10
        range_end = (i + 1) / 10
        severity_histogram.append({
            'range': f'{range_start:.1f}-{range_end:.1f}',
            'range_start': range_start,
            'range_end': range_end,
            'approved': approved_severity_buckets[i],
            'unapproved': unapproved_severity_buckets[i],
        })

    # Build result
    result = {
        'actions': action_data,
        'severity': {
            'histogram': severity_histogram,
            'approved_mean': round(sum(approved_data['severity']) / max(len(approved_data['severity']), 1), 3),
            'unapproved_mean': round(sum(unapproved_data['severity']) / max(len(unapproved_data['severity']), 1), 3),
            'approved_count': len(approved_data['severity']),
            'unapproved_count': len(unapproved_data['severity']),
        },
        'stats': {
            'approved_documents': len(approved_data['severity']),
            'unapproved_documents': len(unapproved_data['severity']),
        }
    }

    print(f"\nAction Types Analysis:")
    for action in action_data:
        print(f"  {action['label']}: Approved={action['approved_mean']:.2f}, Unapproved={action['unapproved_mean']:.2f}")

    print(f"\nSeverity Analysis:")
    print(f"  Approved mean: {result['severity']['approved_mean']:.3f}")
    print(f"  Unapproved mean: {result['severity']['unapproved_mean']:.3f}")

    # Save to public/data
    output_path = Path(__file__).parent.parent / 'public' / 'data' / 'action_severity_data.json'
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\nSaved action/severity data to {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")


if __name__ == '__main__':
    main()

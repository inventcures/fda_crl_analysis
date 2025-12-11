"""
Export FDA CRL analysis results to JSON format for web consumption
"""
import json
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Any

def load_json(path: Path) -> Any:
    """Load JSON file"""
    with open(path, 'r') as f:
        return json.load(f)

def save_json(data: Any, path: Path):
    """Save JSON file with pretty formatting"" "
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"✓ Saved: {path}")

def export_overview_data(parsed_data: List[Dict], output_dir: Path):
    """Export high-level overview statistics"""
    n_total = len(parsed_data)
    n_approved = sum(1 for d in parsed_data if d.get('approval_status') == 'approved')
    n_unapproved = n_total - n_approved

    # Application type breakdown
    app_types = Counter(d.get('application_type', 'Unknown') for d in parsed_data)
    app_type_by_status = defaultdict(lambda: {'approved': 0, 'unapproved': 0})
    for doc in parsed_data:
        app_type = doc.get('application_type', 'Unknown')
        status = doc.get('approval_status', 'unknown')
        if status in ['approved', 'unapproved']:
            app_type_by_status[app_type][status] += 1

    # Year breakdown (from letter_date)
    year_counts = defaultdict(lambda: {'approved': 0, 'unapproved': 0})
    for doc in parsed_data:
        date_str = doc.get('letter_date', '')
        if date_str:
            # Try to extract year
            try:
                year = date_str.split('-')[0] if '-' in date_str else date_str[:4]
                if year.isdigit() and len(year) == 4:
                    status = doc.get('approval_status', 'unknown')
                    if status in ['approved', 'unapproved']:
                        year_counts[year][status] += 1
            except:
                pass

    overview = {
        'summary': {
            'total_crls': n_total,
            'approved': n_approved,
            'unapproved': n_unapproved,
            'approval_rate': round(n_approved / n_total * 100, 1) if n_total > 0 else 0
        },
        'application_types': {
            app_type: {
                'total': app_type_by_status[app_type]['approved'] + app_type_by_status[app_type]['unapproved'],
                'approved': app_type_by_status[app_type]['approved'],
                'unapproved': app_type_by_status[app_type]['unapproved'],
                'approval_rate': round(
                    app_type_by_status[app_type]['approved'] /
                    (app_type_by_status[app_type]['approved'] + app_type_by_status[app_type]['unapproved']) * 100, 1
                ) if (app_type_by_status[app_type]['approved'] + app_type_by_status[app_type]['unapproved']) > 0 else 0
            }
            for app_type in sorted(app_type_by_status.keys(), key=lambda x: x if x else 'ZZZ')
        },
        'yearly_trends': [
            {
                'year': year,
                'approved': counts['approved'],
                'unapproved': counts['unapproved'],
                'total': counts['approved'] + counts['unapproved']
            }
            for year, counts in sorted(year_counts.items())
        ]
    }

    save_json(overview, output_dir / 'overview.json')
    return overview

def export_deficiency_data(parsed_data: List[Dict], analysis_summary: Dict, output_dir: Path):
    """Export deficiency analysis data"""

    # Deficiency categories
    categories = ['safety', 'efficacy', 'cmc_manufacturing', 'clinical_trial_design',
                  'bioequivalence', 'labeling', 'statistical', 'rems']

    # Count deficiencies by category and status
    deficiency_stats = []
    for category in categories:
        approved = sum(1 for d in parsed_data
                      if d.get('approval_status') == 'approved' and
                      category in d.get('deficiency_categories', []))
        unapproved = sum(1 for d in parsed_data
                        if d.get('approval_status') == 'unapproved' and
                        category in d.get('deficiency_categories', []))
        total = approved + unapproved

        deficiency_stats.append({
            'category': category,
            'category_label': category.replace('_', ' ').title(),
            'total': total,
            'approved': approved,
            'unapproved': unapproved,
            'rescue_rate': round(approved / total * 100, 1) if total > 0 else 0
        })

    # Sort by total frequency
    deficiency_stats.sort(key=lambda x: x['total'], reverse=True)

    # Co-occurrence matrix
    cooccurrence = defaultdict(lambda: defaultdict(int))
    for doc in parsed_data:
        cats = doc.get('deficiency_categories', [])
        for i, cat1 in enumerate(categories):
            for cat2 in categories:
                if cat1 in cats and cat2 in cats:
                    cooccurrence[cat1][cat2] += 1

    cooccurrence_data = {
        'categories': categories,
        'matrix': [[cooccurrence[cat1][cat2] for cat2 in categories] for cat1 in categories]
    }

    # Key flags analysis
    flags = {
        'has_safety_concerns': {'label': 'Safety Concerns', 'approved': 0, 'unapproved': 0},
        'has_efficacy_concerns': {'label': 'Efficacy Concerns', 'approved': 0, 'unapproved': 0},
        'has_cmc_issues': {'label': 'CMC Issues', 'approved': 0, 'unapproved': 0},
        'has_clinical_hold': {'label': 'Clinical Hold', 'approved': 0, 'unapproved': 0},
        'requests_new_trial': {'label': 'New Trial Required', 'approved': 0, 'unapproved': 0},
    }

    for doc in parsed_data:
        status = doc.get('approval_status')
        if status in ['approved', 'unapproved']:
            for flag_key in flags.keys():
                if doc.get(flag_key, False):
                    flags[flag_key][status] += 1

    flags_data = [
        {
            'flag': flag_key,
            'label': info['label'],
            'approved': info['approved'],
            'unapproved': info['unapproved'],
            'total': info['approved'] + info['unapproved'],
            'impact_score': round((info['unapproved'] / (info['approved'] + info['unapproved']) * 100), 1)
                           if (info['approved'] + info['unapproved']) > 0 else 0
        }
        for flag_key, info in flags.items()
    ]
    flags_data.sort(key=lambda x: x['impact_score'], reverse=True)

    deficiency_export = {
        'categories': deficiency_stats,
        'cooccurrence': cooccurrence_data,
        'key_flags': flags_data
    }

    save_json(deficiency_export, output_dir / 'deficiencies.json')
    return deficiency_export

def export_language_data(language_summary: Dict, output_dir: Path):
    """Export language analysis data"""

    # Extract statistics
    stats = language_summary.get('statistics', {})

    language_export = {
        'severity': {
            'approved_mean': round(stats.get('severity', {}).get('approved_mean', 0), 3),
            'unapproved_mean': round(stats.get('severity', {}).get('unapproved_mean', 0), 3),
            'difference': round(
                stats.get('severity', {}).get('unapproved_mean', 0) -
                stats.get('severity', {}).get('approved_mean', 0), 3
            )
        },
        'certainty': {
            'approved_mean': round(stats.get('certainty', {}).get('approved_mean', 0), 3),
            'unapproved_mean': round(stats.get('certainty', {}).get('unapproved_mean', 0), 3),
            'difference': round(
                stats.get('certainty', {}).get('unapproved_mean', 0) -
                stats.get('certainty', {}).get('approved_mean', 0), 3
            )
        },
        'visualizations': language_summary.get('visualizations', [])
    }

    save_json(language_export, output_dir / 'language.json')
    return language_export

def export_predictive_data(analysis_summary: Dict, output_dir: Path):
    """Export ML model performance data"""

    classifier_perf = analysis_summary.get('classifier_performance', {})

    models = []
    for model_name, metrics in classifier_perf.items():
        models.append({
            'name': model_name,
            'accuracy': round(metrics.get('accuracy', 0) * 100, 1),
            'cv_mean': round(metrics.get('cv_mean', 0) * 100, 1),
            'cv_std': round(metrics.get('cv_std', 0) * 100, 1)
        })

    # Sort by CV mean
    models.sort(key=lambda x: x['cv_mean'], reverse=True)

    # Feature importance (from significant_features list)
    features = analysis_summary.get('significant_features', [])
    feature_list = [
        {
            'feature': f,
            'label': f.replace('_', ' ').title().replace('Has ', '').replace('App Type ', '')
        }
        for f in features
    ]

    predictive_export = {
        'models': models,
        'best_model': models[0] if models else None,
        'features': feature_list
    }

    save_json(predictive_export, output_dir / 'predictive.json')
    return predictive_export

def export_sample_crls(parsed_data: List[Dict], output_dir: Path, n_samples: int = 10):
    """Export sample CRLs for case study display"""

    # Get mix of approved and unapproved
    approved = [d for d in parsed_data if d.get('approval_status') == 'approved']
    unapproved = [d for d in parsed_data if d.get('approval_status') == 'unapproved']

    # Sample from each
    import random
    random.seed(42)

    approved_samples = random.sample(approved, min(n_samples // 2, len(approved)))
    unapproved_samples = random.sample(unapproved, min(n_samples // 2, len(unapproved)))

    samples = []
    for doc in approved_samples + unapproved_samples:
        samples.append({
            'file_hash': doc.get('file_hash', ''),
            'drug_name': doc.get('drug_name', 'Unknown'),
            'application_number': doc.get('application_number', 'N/A'),
            'application_type': doc.get('application_type', 'N/A'),
            'approval_status': doc.get('approval_status', 'unknown'),
            'letter_date': doc.get('letter_date', 'N/A'),
            'page_count': doc.get('page_count', 0),
            'deficiency_categories': doc.get('deficiency_categories', []),
            'has_safety_concerns': doc.get('has_safety_concerns', False),
            'has_efficacy_concerns': doc.get('has_efficacy_concerns', False),
            'requests_new_trial': doc.get('requests_new_trial', False),
        })

    save_json(samples, output_dir / 'sample_crls.json')
    return samples

def export_search_data(parsed_data: List[Dict], output_dir: Path):
    """
    Export search-optimized CRL data for client-side search.

    Includes full text but removes unnecessary fields to minimize size.
    """
    search_data = []

    for doc in parsed_data:
        # Extract original filename from file_path
        file_path = doc.get('file_path', '')
        original_filename = file_path.split('/')[-1] if file_path else f"{doc.get('file_hash', 'unknown')}.pdf"

        search_doc = {
            # Identifiers
            'file_hash': doc.get('file_hash'),
            'original_filename': original_filename,
            'application_number': doc.get('application_number'),
            'drug_name': doc.get('drug_name'),
            'sponsor_name': doc.get('sponsor_name'),

            # Metadata
            'approval_status': doc.get('approval_status'),
            'therapeutic_area': doc.get('therapeutic_area'),
            'letter_date': doc.get('letter_date'),
            'application_type': doc.get('application_type'),

            # Searchable content
            'raw_text': doc.get('raw_text', ''),
            'deficiency_categories': doc.get('deficiency_categories', []),
            'deficiencies_text': ' '.join([
                d.get('text', '') for d in doc.get('deficiencies', [])
            ]),

            # Boolean flags
            'has_safety_concerns': doc.get('has_safety_concerns', False),
            'has_efficacy_concerns': doc.get('has_efficacy_concerns', False),
            'has_cmc_issues': doc.get('has_cmc_issues', False),
            'requests_new_trial': doc.get('requests_new_trial', False),

            # Derived fields for display
            'snippet': doc.get('raw_text', '')[:200] + '...',  # First 200 chars
            'page_count': doc.get('page_count', 0),
        }

        search_data.append(search_doc)

    # Save as JSON (minified to save space)
    output_path = output_dir / 'search_crls.json'
    with open(output_path, 'w') as f:
        json.dump(search_data, f, separators=(',', ':'))  # Minified JSON

    # Print size stats
    file_size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"✓ Search data exported: {output_path}")
    print(f"  File size: {file_size_mb:.1f}MB")
    print(f"  Documents: {len(search_data)}")

    return search_data

def export_clustering_data(parsed_data: List[Dict], output_dir: Path):
    """Export clustering data for interactive visualization"""
    from src.language_analysis import CRLLatentSpaceVisualizer
    
    print("  Generating clustering data (this may take a moment)...")
    visualizer = CRLLatentSpaceVisualizer()
    clustering_data = visualizer.get_clustering_data(parsed_data)
    
    if 'error' not in clustering_data:
        save_json(clustering_data, output_dir / 'clustering.json')
        print(f"✓ Clustering data exported: {output_dir / 'clustering.json'}")
    else:
        print(f"⚠ Clustering export failed: {clustering_data['error']}")
    
    return clustering_data

def main():
    """Main export function"""
    print("=" * 60)
    print("EXPORTING DATA FOR WEB")
    print("=" * 60)

    # Paths
    base_dir = Path(__file__).parent
    data_dir = base_dir / 'data' / 'processed'
    outputs_dir = base_dir / 'outputs'
    web_data_dir = base_dir / 'website' / 'public' / 'data'

    # Load data
    print("\nLoading data...")
    parsed_data = load_json(data_dir / 'parsed_crls.json')
    analysis_summary = load_json(outputs_dir / 'analysis_summary.json')
    language_summary = load_json(outputs_dir / 'language' / 'language_analysis_results.json')

    print(f"✓ Loaded {len(parsed_data)} CRLs")

    # Export different datasets
    print("\nExporting datasets...")
    export_overview_data(parsed_data, web_data_dir)
    export_deficiency_data(parsed_data, analysis_summary, web_data_dir)
    export_language_data(language_summary, web_data_dir)
    export_predictive_data(analysis_summary, web_data_dir)
    export_predictive_data(analysis_summary, web_data_dir)
    export_sample_crls(parsed_data, web_data_dir)
    export_clustering_data(parsed_data, web_data_dir)

    # Export search data
    print("\nExporting search data...")
    export_search_data(parsed_data, web_data_dir)

    # Copy images to web public folder
    import shutil
    web_images_dir = base_dir / 'website' / 'public' / 'images'
    web_images_dir.mkdir(parents=True, exist_ok=True)

    # Copy main analysis images
    for img in ['deficiency_frequency.png', 'rescue_rates.png', 'cooccurrence_heatmap.png',
                'feature_importance.png', 'roc_curves.png', 'statistical_comparison.png']:
        src = outputs_dir / img
        if src.exists():
            shutil.copy(src, web_images_dir / img)
            print(f"✓ Copied: {img}")

    # Copy language analysis images
    lang_images_dir = web_images_dir / 'language'
    lang_images_dir.mkdir(parents=True, exist_ok=True)
    for img in language_summary.get('visualizations', []):
        src = outputs_dir / 'language' / img
        if src.exists():
            shutil.copy(src, lang_images_dir / img)
            print(f"✓ Copied: language/{img}")

    print("\n" + "=" * 60)
    print("✓ Export complete!")
    print(f"Data saved to: {web_data_dir}")
    print(f"Images saved to: {web_images_dir}")
    print("=" * 60)

if __name__ == '__main__':
    main()

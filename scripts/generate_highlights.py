#!/usr/bin/env python3
"""
Generate Highlight Metadata for Document Viewer (Predictive Education Edition)
==========================================================================

Extracts bounding box coordinates for predictive keywords in CRL PDFs.
Generates website/public/data/crl_highlights.json with educational insights.
Includes 'trigger_rect' for sub-highlighting and granular sentiment analysis.
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add src to path to import CRLParser
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root / "src"))

try:
    from pdf_parser import CRLParser
    import pdfplumber
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Please install requirements: pip install pdfplumber")
    sys.exit(1)

def get_bbox_from_chars(chars):
    """Calculate the bounding box [x, y, w, h] for a list of pdfplumber chars."""
    if not chars:
        return None
    x0 = min(c['x0'] for c in chars)
    top = min(c['top'] for c in chars)
    x1 = max(c['x1'] for c in chars)
    bottom = max(c['bottom'] for c in chars)
    return [x0, top, x1 - x0, bottom - top]

def generate_highlights(
    parsed_data_path: Path,
    output_path: Path,
    limit: int = None
):
    print(f"Loading parsed data from {parsed_data_path}...")
    with open(parsed_data_path, 'r') as f:
        documents = json.load(f)

    if limit:
        documents = documents[:limit]
        print(f"Limiting to first {limit} documents.")

    highlights_map: Dict[str, Dict[str, Any]] = {}

    # EXPANDED PREDICTIVE PATTERNS with Granular Sentiment
    PREDICTIVE_PATTERNS = {
        'critical_efficacy': {
            'keywords': [
                'failed to demonstrate', 'did not meet', 'lack of substantial evidence',
                'insufficient data', 'statistically significant', 'primary endpoint',
                'not statistically significant', 'failed to reach', 'inconclusive efficacy'
            ],
            'type': 'risk',
            'sentiment': 'critical_risk',
            'reason': "⚠️ **Critical Efficacy Failure**: Strongest predictor of non-approval (90%+ risk). Usually requires new Phase 3 trials."
        },
        'safety_alert': {
            'keywords': [
                'safety signal', 'severe toxicity', 'mortality imbalance', 'unreasonable risk',
                'safety profile', 'life-threatening', 'adverse reaction rate', 'boxed warning'
            ],
            'type': 'risk',
            'sentiment': 'high_risk',
            'reason': "⚠️ **Safety Alert**: Serious safety concerns identified. May require REMS or additional safety studies."
        },
        'clinical_design': {
             'keywords': [
                 'study design', 'population mismatch', 'endpoint selection', 'bias',
                 'confounding factor', 'inadequate power', 'sample size', 'trial conduct'
             ],
             'type': 'risk',
             'sentiment': 'major_concern',
             'reason': "⚠️ **Study Design Flaw**: Issues with how the trial was conducted, often leading to uninterpretable results."
        },
        'cmc_quality': {
            'keywords': [
                'manufacturing process', 'sterility', 'impurity', 'stability data',
                'facility inspection', 'cGMP', 'quality control', 'batch failure', 'out of specification'
            ],
            'type': 'risk',
            'sentiment': 'moderate_risk',
            'reason': "⚠️ **CMC/Quality Issue**: Manufacturing deficiencies. Frequent cause of delay but typically has a high rescue rate (fixable)."
        },
        'labeling_negotiation': {
            'keywords': [
                'labeling change', 'package insert', 'indication wording',
                'risk management plan', 'post-marketing', 'labeling revision'
            ],
            'type': 'risk', 
            'sentiment': 'moderate_concern',
            'reason': "📝 **Labeling/Regulatory**: Negotiable points regarding how the drug is marketed or described."
        },
        'approval_strength': {
            'keywords': [
                'adequate', 'acceptable', 'sufficient', 'demonstrated efficacy',
                'supportive', 'met the objective', 'favorable', 'benefits outweigh'
            ],
            'type': 'strength',
            'sentiment': 'strong_positive',
            'reason': "✅ **Regulatory Strength**: Explicit confirmation that a section has passed review standards."
        },
        'mitigating_factor': {
            'keywords': [
                'post-hoc analysis', 'exploratory endpoint', 'trend toward',
                'numerical advantage', 'subgroup analysis', 'promising activity'
            ],
            'type': 'nuance',
            'sentiment': 'tentative_positive',
            'reason': "⚖️ **Mitigating Factor**: Non-definitive but potentially supportive evidence. Often used to argue for approval despite missed endpoints."
        }
    }

    processed_count = 0
    
    for doc in documents:
        file_hash = doc.get('file_hash')
        file_path = doc.get('file_path')
        
        if not file_path or not Path(file_path).exists():
            print(f"Skipping {file_hash}: File not found at {file_path}")
            continue

        doc_highlights = []
        
        try:
            with pdfplumber.open(file_path) as pdf:
                print(f"Processing {file_hash} ({processed_count + 1}/{len(documents)})...")
                
                for page_idx, page in enumerate(pdf.pages):
                    for category, config in PREDICTIVE_PATTERNS.items():
                        keywords = config['keywords']
                        
                        # Use wider context regex (up to 250 chars pre/post)
                        escaped_keywords = [re.escape(k) for k in keywords]
                        keyword_pattern = '|'.join(escaped_keywords)
                        pattern = r'(?i)(?:[^\.\n]{0,250})\b(' + keyword_pattern + r')\b(?:[^\.\n]{0,250}[\.\n]?)'
                        
                        matches = page.search(pattern, regex=True, case=False)
                        
                        for match in matches:
                            full_text = match["text"]
                            full_rect = get_bbox_from_chars(match["chars"])
                            
                            # Find trigger rect for the keyword
                            found_keyword = None
                            for k in keywords:
                                if k.lower() in full_text.lower():
                                    found_keyword = k
                                    break
                            
                            trigger_rect = None
                            if found_keyword:
                                try:
                                    start_idx = full_text.lower().index(found_keyword.lower())
                                    end_idx = start_idx + len(found_keyword)
                                    if start_idx < len(match["chars"]) and end_idx <= len(match["chars"]):
                                         trigger_chars = match["chars"][start_idx:end_idx]
                                         trigger_rect = get_bbox_from_chars(trigger_chars)
                                except ValueError:
                                    pass

                            doc_highlights.append({
                                "page": page_idx + 1,
                                "rect": full_rect,
                                "trigger_rect": trigger_rect,
                                "text": full_text.strip(),
                                "category": category,
                                "type": config['type'],
                                "sentiment": config['sentiment'], # Granular sentiment
                                "reason": config['reason'],
                                "page_width": float(page.width),
                                "page_height": float(page.height)
                            })
                            
        except Exception as e:
            print(f"Error processing {file_hash}: {e}")
            continue

        if doc_highlights:
            highlights_map[file_hash] = {
                "highlights": doc_highlights
            }
            
        processed_count += 1

    # Save output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(highlights_map, f, indent=2)
    
    print(f"\nSaved highlights for {len(highlights_map)} documents to {output_path}")

if __name__ == "__main__":
    data_dir = project_root / "data"
    parsed_json = data_dir / "processed" / "parsed_crls.json"
    output_json = project_root / "website" / "public" / "data" / "crl_highlights.json"
    
    generate_highlights(parsed_json, output_json)
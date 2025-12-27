#!/usr/bin/env python3
"""
Enhance CRL Data with Drug Name Extraction
==========================================

Scans PDF text for drug names using common header patterns like:
- "Re: [Drug Name]"
- "Subject: [Drug Name]"
- "NDA 123456 ([Drug Name])"

Updates website/public/data/enriched_crls.json
"""

import json
import re
from pathlib import Path
import sys

# Add src to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root / "src"))

try:
    import pdfplumber
except ImportError:
    print("pip install pdfplumber")
    sys.exit(1)

def clean_text(text):
    return re.sub(r'\s+', ' ', text).strip()

def extract_drug_name(text):
    # Pattern 1: NDA/BLA 123456 (DRUG NAME)
    match = re.search(r'(?:NDA|BLA)\s*\d+\s*([^)]+)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Pattern 2: Re: [Drug Name] (or Subject:)
    # Look for lines starting with Re: followed by caps
    match = re.search(r'(?:Re|Subject):\s*([A-Z0-9\-\s\(\)]+?)(?:\n|NDA|BLA|application)', text)
    if match:
        candidate = match.group(1).strip()
        if len(candidate) > 3 and len(candidate) < 50:
            return candidate
            
    return None

def enhance_data():
    data_path = project_root / 'website/public/data/enriched_crls.json'
    
    with open(data_path, 'r') as f:
        documents = json.load(f)
        
    print(f"Scanning {len(documents)} documents for drug names...")
    
    updates = 0
    for doc in documents:
        # Check if we already have a good name (not just a number)
        current_name = doc.get('enriched', {}).get('openfda_brand_name') or doc.get('drug_name')
        if current_name and not re.match(r'^\d+$', current_name):
            continue # Already has a name
            
        # Needs extraction
        file_path = doc.get('file_path')
        if not file_path or not Path(file_path).exists():
            continue
            
        try:
            # Quick scan of first page only
            with pdfplumber.open(file_path) as pdf:
                first_page = pdf.pages[0]
                text = first_page.extract_text()
                
                extracted_name = extract_drug_name(text)
                
                if extracted_name:
                    print(f"Found: {doc['application_number']} -> {extracted_name}")
                    if 'enriched' not in doc: doc['enriched'] = {}
                    doc['enriched']['openfda_brand_name'] = extracted_name
                    updates += 1
                    
        except Exception as e:
            # print(f"Error reading {file_path}: {e}")
            pass

    with open(data_path, 'w') as f:
        json.dump(documents, f, indent=2)
        
    print(f"\nUpdated {updates} documents with new drug names.")

if __name__ == "__main__":
    enhance_data()

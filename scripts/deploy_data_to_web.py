import json
import os
import shutil
from pathlib import Path

def deploy_data():
    root = Path.cwd()
    source_path = root / 'data/processed/parsed_crls.json'
    dest_path = root / 'website/public/data/enriched_crls.json'
    
    # Read full dataset
    with open(source_path, 'r') as f:
        data = json.load(f)
        
    print(f"Loaded {len(data)} records from {source_path}")
    
    # Simple enrichment pass (mocking the 'enriched' field if missing to avoid frontend crashes)
    for doc in data:
        if 'enriched' not in doc:
            doc['enriched'] = {
                "openfda_brand_name": doc.get('drug_name'),
                "formatted_app_number": f"{doc.get('application_type', 'NDA')}{doc.get('application_number', '')}"
            }
            
    # Write to website data
    with open(dest_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Deployed {len(data)} records to {dest_path}")

if __name__ == "__main__":
    deploy_data()

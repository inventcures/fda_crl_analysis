import json
import time
from enrich_data import get_pubchem_smiles, get_opentargets_id, get_drug_targets, get_target_details, extract_oncology_evidence

INPUT_FILE = 'manual_oncology_data.json'
OUTPUT_FILE = 'public/data/enriched_manual_oncology.json'

def enrich_manual():
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)

    print(f"Enriching {len(data)} manual records...")
    
    for item in data:
        generic = item.get("openfda_generic_name")
        print(f"Processing {generic}...")
        
        smiles = get_pubchem_smiles(generic)
        ot_id = get_opentargets_id(generic)
        target_info = []
        
        if ot_id:
            targets = get_drug_targets(ot_id)
            for t in targets:
                details = get_target_details(t['id'])
                if details:
                    simple_pathways = [
                        f"{p['topLevelTerm']}: {p['pathway']}" 
                        for p in details.get('pathways', [])[:5] 
                    ]
                    onc_evidence = extract_oncology_evidence(details.get('associatedDiseases'))
                    
                    target_info.append({
                        "symbol": t['symbol'],
                        "id": t['id'],
                        "biotype": details.get('biotype'),
                        "genetic_constraint": details.get('geneticConstraint'),
                        "cancer_hallmarks": details.get('hallmarks', {}).get('cancerHallmarks', []),
                        "top_pathways": simple_pathways,
                        "oncology_evidence": onc_evidence
                    })
        
        item["enriched"] = {
            "smiles": smiles,
            "open_targets_id": ot_id,
            "targets": target_info
        }
        time.sleep(1) 

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    enrich_manual()

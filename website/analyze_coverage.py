import json

def analyze():
    with open('public/data/enriched_crls.json', 'r') as f:
        data = json.load(f)

    oncology_crls = [d for d in data if 'oncology_specific' in d.get('deficiency_categories', [])]
    
    print(f"Total Oncology CRLs: {len(oncology_crls)}")
    
    approved = [d for d in oncology_crls if d['approval_status'] == 'approved']
    unapproved = [d for d in oncology_crls if d['approval_status'] == 'unapproved']
    
    print(f"Approved: {len(approved)}")
    print(f"Unapproved: {len(unapproved)}")
    
    print("\n--- Unapproved Oncology CRLs ---")
    for d in unapproved:
        enriched = d.get('enriched', {})
        has_targets = len(enriched.get('targets', [])) > 0
        print(f"App#: {d.get('application_number')} | Drug: {d.get('drug_name')} | Enriched Targets: {has_targets}")
        if enriched.get('openfda_generic_name'):
             print(f"   Generic: {enriched.get('openfda_generic_name')}")

    print("\n--- Approved Oncology CRLs with Targets ---")
    count_with_targets = 0
    for d in approved:
        enriched = d.get('enriched', {})
        if len(enriched.get('targets', [])) > 0:
            count_with_targets += 1
    print(f"Count: {count_with_targets} / {len(approved)}")

if __name__ == "__main__":
    analyze()

import json

def check_oncology():
    try:
        with open('public/data/sample_crls.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("File not found.")
        return

    onc_crls = [d for d in data if 'oncology_specific' in d.get('deficiency_categories', [])]
    
    print(f"Found {len(onc_crls)} records tagged as 'oncology_specific'.")
    
    for i, crl in enumerate(onc_crls):
        print(f"\nRecord {i+1}:")
        print(f"  App Number: {crl.get('application_number')}")
        print(f"  Drug Name: {crl.get('drug_name')}")
        print(f"  Status: {crl.get('approval_status')}")
        print(f"  Deficiencies: {crl.get('deficiency_categories')}")

if __name__ == "__main__":
    check_oncology()

import json
import requests
import time
import os

# Paths
INPUT_FILE = 'public/data/sample_crls.json'
OUTPUT_FILE = 'public/data/enriched_crls.json'

def get_openfda_label(app_id_formatted):
    """
    Fetches label data from OpenFDA using the formatted application number (e.g., NDA0213072).
    Returns (generic_name, brand_name, pharm_class_epc).
    """
    url = f'https://api.fda.gov/drug/label.json?search=openfda.application_number:"{app_id_formatted}"&limit=1'
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            if "results" in data:
                openfda = data["results"][0].get("openfda", {})
                generic = openfda.get("generic_name", [None])[0]
                brand = openfda.get("brand_name", [None])[0]
                pharm_class = openfda.get("pharm_class_epc", [])
                return generic, brand, pharm_class
    except Exception as e:
        print(f"Error fetching OpenFDA Label for {app_id_formatted}: {e}")
    return None, None, []

def get_openfda_adverse_events(app_id_formatted):
    """
    Fetches the count of adverse events from OpenFDA for the given application number.
    """
    url = f'https://api.fda.gov/drug/event.json?search=patient.drug.openfda.application_number:"{app_id_formatted}"&limit=1'
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            return data["meta"]["results"]["total"]
    except Exception:
        pass # It's common to find no events
    return 0

def get_pubchem_smiles(drug_name):
    """
    Fetches SMILES from PubChem for a given drug name.
    Tries IsomericSMILES first, then CanonicalSMILES.
    """
    if not drug_name:
        return None
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{drug_name}/property/IsomericSMILES,CanonicalSMILES/JSON"
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            if "PropertyTable" in data:
                props = data["PropertyTable"]["Properties"][0]
                return props.get("IsomericSMILES") or props.get("CanonicalSMILES")
    except Exception as e:
        print(f"Error fetching PubChem for {drug_name}: {e}")
    return None

def get_opentargets_id(drug_name):
    """
    Searches Open Targets for a ChEMBL ID using the drug name.
    """
    if not drug_name:
        return None
    
    query = """
    query Search($queryString: String!) {
      search(queryString: $queryString, entityNames: ["drug"], page: {index: 0, size: 1}) {
        hits {
          id
        }
      }
    }
    """
    url = "https://api.platform.opentargets.org/api/v4/graphql"
    try:
        resp = requests.post(url, json={"query": query, "variables": {"queryString": drug_name}})
        if resp.status_code == 200:
            data = resp.json()
            if "data" in data and "search" in data["data"]:
                hits = data["data"]["search"]["hits"]
                if hits:
                    return hits[0]["id"]
    except Exception as e:
        print(f"Error fetching Open Targets for {drug_name}: {e}")
    return None

def get_drug_targets(chembl_id):
    """
    Fetches the targets modulated by the drug from Open Targets.
    Returns a list of dicts: {'id': 'ENSG...', 'symbol': 'ESR1'}
    """
    if not chembl_id:
        return []
        
    query = """
    query DrugTargets($chemblId: String!) {
      drug(chemblId: $chemblId) {
        mechanismsOfAction {
          rows {
            targets {
              id
              approvedSymbol
            }
          }
        }
      }
    }
    """
    url = "https://api.platform.opentargets.org/api/v4/graphql"
    try:
        resp = requests.post(url, json={"query": query, "variables": {"chemblId": chembl_id}})
        if resp.status_code == 200:
            data = resp.json()
            if "data" in data and "drug" in data["data"]:
                drug = data["data"]["drug"]
                if drug and drug["mechanismsOfAction"]:
                    targets = []
                    for row in drug["mechanismsOfAction"]["rows"]:
                        targets.extend(row["targets"])
                    # Deduplicate by ID
                    seen = set()
                    unique_targets = []
                    for t in targets:
                        if t['id'] not in seen:
                            unique_targets.append({'id': t['id'], 'symbol': t['approvedSymbol']})
                            seen.add(t['id'])
                    return unique_targets
    except Exception as e:
        print(f"Error fetching Targets for {chembl_id}: {e}")
    return []

def get_target_details(target_id):
    """
    Fetches detailed biological info for a target: pathways, genetic constraints, cancer hallmarks,
    and oncology-specific evidence.
    """
    query = """
    query TargetDetails($targetId: String!) {
      target(ensemblId: $targetId) {
        biotype
        geneticConstraint {
            constraintType
            score
            oe
            oeLower
            oeUpper
        }
        pathways {
          pathway
          topLevelTerm
        }
        hallmarks {
            cancerHallmarks {
                label
                description
            }
        }
        associatedDiseases(page: {index: 0, size: 50}) {
          rows {
            disease {
              id
              name
            }
            score
            datatypeScores {
              id
              score
            }
          }
        }
      }
    }
    """
    url = "https://api.platform.opentargets.org/api/v4/graphql"
    try:
        resp = requests.post(url, json={"query": query, "variables": {"targetId": target_id}})
        if resp.status_code == 200:
            data = resp.json()
            if "data" in data and "target" in data["data"]:
                return data["data"]["target"]
    except Exception as e:
        print(f"Error fetching Target Details for {target_id}: {e}")
    return None

def extract_oncology_evidence(associated_diseases):
    """
    Parses associated diseases to find the strongest oncology link and its genetic evidence.
    Returns a dict with max_oncology_score, genetic_score, somatic_score, and disease_name.
    """
    if not associated_diseases:
        return None
        
    oncology_keywords = ["cancer", "neoplasm", "carcinoma", "tumor", "sarcoma", "leukemia", "lymphoma", "melanoma"]
    
    best_match = None
    max_score = -1.0
    
    for row in associated_diseases.get("rows", []):
        disease_name = row["disease"]["name"].lower()
        # Check if it's an oncology disease
        if any(k in disease_name for k in oncology_keywords):
            if row["score"] > max_score:
                max_score = row["score"]
                best_match = row
                
    if best_match:
        # Extract genetic evidence scores
        genetic_score = 0.0
        somatic_score = 0.0
        
        for dt in best_match.get("datatypeScores", []):
            if dt["id"] == "genetic_association":
                genetic_score = dt["score"]
            elif dt["id"] == "somatic_mutation":
                somatic_score = dt["score"]
                
        return {
            "disease_name": best_match["disease"]["name"],
            "overall_association_score": max_score,
            "genetic_association_score": genetic_score,
            "somatic_mutation_score": somatic_score
        }
    return None

def enrich_data():
    print("Loading sample data...")
    if not os.path.exists(INPUT_FILE):
        print(f"Input file {INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, 'r') as f:
        crls = json.load(f)

    print(f"Enriching {len(crls)} records...")
    enriched_count = 0

    for crl in crls:
        # 1. Format Application Number (NDA/BLA + 6 digits)
        app_type = (crl.get("application_type") or "").upper()
        app_num_raw = str(crl.get("application_number") or "")
        
        # Clean raw number
        if app_num_raw.isdigit():
             app_num_padded = app_num_raw.zfill(6)
             formatted_app_num = f"{app_type}{app_num_padded}"
        else:
             formatted_app_num = app_num_raw

        print(f"Processing {formatted_app_num}...")

        # 2. OpenFDA Label
        generic, brand, pharm_class = get_openfda_label(formatted_app_num)
        
        # 3. OpenFDA Adverse Events
        ae_count = get_openfda_adverse_events(formatted_app_num)

        # 4. External APIs (require Name)
        smiles = None
        ot_id = None
        target_info = []
        
        if generic:
            smiles = get_pubchem_smiles(generic)
            ot_id = get_opentargets_id(generic)
            enriched_count += 1
            
            # 5. Open Targets Analysis
            if ot_id:
                targets = get_drug_targets(ot_id)
                for t in targets:
                    details = get_target_details(t['id'])
                    if details:
                        # Simplify pathways for storage
                        simple_pathways = [
                            f"{p['topLevelTerm']}: {p['pathway']}" 
                            for p in details.get('pathways', [])[:5] # Limit to top 5
                        ]
                        
                        # Extract Oncology Evidence
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
        
        # Update Record
        crl["enriched"] = {
            "formatted_app_number": formatted_app_num,
            "openfda_generic_name": generic,
            "openfda_brand_name": brand,
            "pharm_class": pharm_class,
            "adverse_event_count": ae_count,
            "smiles": smiles,
            "open_targets_id": ot_id,
            "targets": target_info
        }
        
        # Be nice to APIs
        time.sleep(0.5)

    print(f"Saving enriched data to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(crls, f, indent=2)
    
    print(f"Done. Enriched {enriched_count} records with at least a Generic Name.")

if __name__ == "__main__":
    enrich_data()

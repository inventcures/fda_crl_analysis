"""
FDA CRL Data Acquisition Module
Downloads and organizes Complete Response Letters from OpenFDA
"""

import os
import json
import zipfile
import requests
from pathlib import Path
from datetime import datetime
from typing import Optional
import hashlib

# URLs for CRL data
APPROVED_CRL_ZIP = "https://download.open.fda.gov/approved_CRLs.zip"
UNAPPROVED_CRL_ZIP = "https://download.open.fda.gov/unapproved_CRLs.zip"
OPENFDA_CRL_API = "https://api.fda.gov/other/crl.json"

class CRLDataAcquisition:
    """Handles downloading and organizing FDA CRL data."""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / "raw"
        self.approved_dir = self.raw_dir / "approved_crls"
        self.unapproved_dir = self.raw_dir / "unapproved_crls"
        self.processed_dir = self.data_dir / "processed"
        self._setup_directories()
    
    def _setup_directories(self):
        """Create necessary directories."""
        for d in [self.raw_dir, self.approved_dir, self.unapproved_dir, self.processed_dir]:
            d.mkdir(parents=True, exist_ok=True)
    
    def download_file(self, url: str, dest_path: Path, force: bool = False) -> bool:
        """Download a file with progress indication."""
        if dest_path.exists() and not force:
            print(f"File already exists: {dest_path}")
            return True
        
        print(f"Downloading: {url}")
        try:
            response = requests.get(url, stream=True, timeout=300)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(dest_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size:
                        pct = (downloaded / total_size) * 100
                        print(f"\rProgress: {pct:.1f}%", end="", flush=True)
            
            print(f"\nSaved to: {dest_path}")
            return True
        except Exception as e:
            print(f"Download failed: {e}")
            return False
    
    def download_approved_crls(self, force: bool = False) -> bool:
        """Download approved CRLs ZIP file."""
        zip_path = self.raw_dir / "approved_CRLs.zip"
        return self.download_file(APPROVED_CRL_ZIP, zip_path, force)
    
    def download_unapproved_crls(self, force: bool = False) -> bool:
        """Download unapproved CRLs ZIP file."""
        zip_path = self.raw_dir / "unapproved_CRLs.zip"
        return self.download_file(UNAPPROVED_CRL_ZIP, zip_path, force)
    
    def extract_zip(self, zip_path: Path, extract_to: Path) -> list:
        """Extract ZIP file and return list of extracted files."""
        extracted = []
        print(f"Extracting: {zip_path}")
        
        with zipfile.ZipFile(zip_path, 'r') as zf:
            for member in zf.namelist():
                if member.endswith('.pdf'):
                    zf.extract(member, extract_to)
                    extracted.append(extract_to / member)
                    print(f"  Extracted: {member}")
        
        print(f"Total extracted: {len(extracted)} files")
        return extracted
    
    def download_and_extract_all(self, force: bool = False) -> dict:
        """Download and extract all CRL data."""
        results = {"approved": [], "unapproved": []}
        
        # Approved CRLs
        if self.download_approved_crls(force):
            zip_path = self.raw_dir / "approved_CRLs.zip"
            if zip_path.exists():
                results["approved"] = self.extract_zip(zip_path, self.approved_dir)
        
        # Unapproved CRLs
        if self.download_unapproved_crls(force):
            zip_path = self.raw_dir / "unapproved_CRLs.zip"
            if zip_path.exists():
                results["unapproved"] = self.extract_zip(zip_path, self.unapproved_dir)
        
        return results
    
    def query_crl_api(self, search: str = "", limit: int = 100, skip: int = 0) -> dict:
        """Query the OpenFDA CRL API endpoint."""
        params = {"limit": limit, "skip": skip}
        if search:
            params["search"] = search
        
        try:
            response = requests.get(OPENFDA_CRL_API, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"API query failed: {e}")
            return {}
    
    def get_all_crl_metadata(self, max_records: int = 1000) -> list:
        """Fetch all CRL metadata from API with pagination."""
        all_results = []
        skip = 0
        limit = 100
        
        while skip < max_records:
            print(f"Fetching records {skip} to {skip + limit}...")
            data = self.query_crl_api(limit=limit, skip=skip)
            
            if not data.get("results"):
                break
            
            all_results.extend(data["results"])
            
            total = data.get("meta", {}).get("results", {}).get("total", 0)
            if skip + limit >= total:
                break
            
            skip += limit
        
        print(f"Total records fetched: {len(all_results)}")
        return all_results
    
    def create_manifest(self) -> dict:
        """Create a manifest of all downloaded CRL files."""
        manifest = {
            "created_at": datetime.now().isoformat(),
            "approved": [],
            "unapproved": []
        }
        
        for pdf_path in self.approved_dir.rglob("*.pdf"):
            manifest["approved"].append({
                "filename": pdf_path.name,
                "path": str(pdf_path),
                "size_bytes": pdf_path.stat().st_size,
                "md5": hashlib.md5(pdf_path.read_bytes()).hexdigest()
            })
        
        for pdf_path in self.unapproved_dir.rglob("*.pdf"):
            manifest["unapproved"].append({
                "filename": pdf_path.name,
                "path": str(pdf_path),
                "size_bytes": pdf_path.stat().st_size,
                "md5": hashlib.md5(pdf_path.read_bytes()).hexdigest()
            })
        
        manifest_path = self.processed_dir / "manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"Manifest saved: {manifest_path}")
        print(f"  Approved CRLs: {len(manifest['approved'])}")
        print(f"  Unapproved CRLs: {len(manifest['unapproved'])}")
        
        return manifest


if __name__ == "__main__":
    # Example usage
    acq = CRLDataAcquisition(data_dir="data")
    
    # Download and extract all CRLs
    results = acq.download_and_extract_all()
    
    # Create manifest
    manifest = acq.create_manifest()
    
    # Also try to get API metadata
    api_data = acq.get_all_crl_metadata(max_records=500)
    if api_data:
        with open(acq.processed_dir / "api_metadata.json", 'w') as f:
            json.dump(api_data, f, indent=2)

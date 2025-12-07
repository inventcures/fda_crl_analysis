"""
FDA CRL PDF Parsing Module
Extracts and structures text content from CRL PDFs
"""

import os
import re
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import hashlib

# PDF extraction libraries
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False


@dataclass
class CRLDocument:
    """Structured representation of a Complete Response Letter."""
    file_path: str
    file_hash: str
    approval_status: str  # 'approved' or 'unapproved'
    
    # Extracted metadata
    drug_name: Optional[str] = None
    application_number: Optional[str] = None  # NDA/BLA number
    application_type: Optional[str] = None  # NDA, BLA, ANDA
    sponsor_name: Optional[str] = None
    letter_date: Optional[str] = None
    therapeutic_area: Optional[str] = None  # 'oncology', 'cardiology', 'neurology', 'unknown'

    # Content
    raw_text: str = ""
    page_count: int = 0
    
    # Extracted deficiencies
    deficiencies: List[Dict[str, Any]] = None
    deficiency_categories: List[str] = None
    
    # Analysis flags
    has_safety_concerns: bool = False
    has_efficacy_concerns: bool = False
    has_cmc_issues: bool = False
    has_clinical_hold: bool = False
    requests_new_trial: bool = False
    
    def __post_init__(self):
        if self.deficiencies is None:
            self.deficiencies = []
        if self.deficiency_categories is None:
            self.deficiency_categories = []
    
    def to_dict(self) -> dict:
        return asdict(self)


class CRLParser:
    """Parses FDA Complete Response Letter PDFs."""
    
    # Regex patterns for extraction
    PATTERNS = {
        'nda_number': r'NDA\s*(\d{5,6})',
        'bla_number': r'BLA\s*(\d{5,6})',
        'anda_number': r'ANDA\s*(\d{5,6})',
        'date': r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
        'sponsor': r'(?:Dear\s+)?(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        'drug_name_header': r'(?:RE:|Re:|Subject:)\s*([A-Za-z0-9\-\s]+?)(?:\s*\(|NDA|BLA)',
    }
    
    # Deficiency category keywords
    DEFICIENCY_KEYWORDS = {
        'safety': [
            'safety', 'adverse event', 'adverse reaction', 'toxicity', 'death',
            'serious adverse', 'black box', 'boxed warning', 'risk', 'harm',
            'side effect', 'contraindication', 'mortality', 'morbidity'
        ],
        'efficacy': [
            'efficacy', 'effectiveness', 'primary endpoint', 'secondary endpoint',
            'failed to demonstrate', 'did not meet', 'clinical benefit', 
            'response rate', 'survival', 'outcome', 'statistical significance'
        ],
        'cmc_manufacturing': [
            'cmc', 'manufacturing', 'chemistry', 'cgmp', 'gmp', 'facility',
            'production', 'quality control', 'batch', 'stability', 'specification',
            'impurity', 'degradation', 'process validation', 'analytical method'
        ],
        'clinical_trial_design': [
            'trial design', 'study design', 'protocol', 'randomization', 
            'blinding', 'control group', 'comparator', 'sample size', 
            'inclusion criteria', 'exclusion criteria', 'heterogeneity'
        ],
        'bioequivalence': [
            'bioequivalence', 'bioavailability', 'pharmacokinetic', 'pk',
            'absorption', 'dissolution', 'formulation'
        ],
        'labeling': [
            'labeling', 'label', 'package insert', 'prescribing information',
            'indication', 'dosage', 'administration', 'warnings'
        ],
        'statistical': [
            'statistical', 'analysis', 'missing data', 'imputation',
            'sensitivity analysis', 'subgroup', 'multiplicity', 'p-value'
        ],
        'rems': [
            'rems', 'risk evaluation', 'mitigation strategy', 'medication guide',
            'patient registry', 'restricted distribution'
        ],
        'oncology_specific': [
            # Efficacy endpoints
            'overall survival', 'progression-free survival', 'pfs', 'os',
            'objective response rate', 'orr', 'complete response', 'partial response',
            'disease-free survival', 'dfs', 'time to progression', 'ttp',
            'durability of response', 'tumor response', 'tumor burden',
            # Safety concerns
            'cardiotoxicity', 'hepatotoxicity', 'nephrotoxicity', 'neurotoxicity',
            'tumor lysis syndrome', 'cytokine release syndrome', 'immunotoxicity',
            'secondary malignancy', 'grade 3', 'grade 4', 'dose-limiting toxicity',
            # Trial design
            'phase 1 trial', 'phase 2 trial', 'phase 3 trial', 'single-arm trial',
            'historical control', 'basket trial', 'umbrella trial', 'biomarker validation',
            # Population
            'refractory', 'resistant', 'metastatic', 'advanced',
            'first-line', 'second-line', 'heavily pre-treated'
        ]
    }

    # Therapeutic area keywords for classification
    THERAPEUTIC_AREA_KEYWORDS = {
        'oncology': [
            'cancer', 'tumor', 'carcinoma', 'lymphoma', 'leukemia', 'melanoma',
            'chemotherapy', 'immunotherapy', 'checkpoint inhibitor', 'cytotoxic',
            'oncology', 'oncologic', 'malignancy', 'metastatic',
            'division of oncology', 'office of oncologic diseases', 'neoplasm',
            'sarcoma', 'myeloma', 'glioblastoma', 'adenocarcinoma'
        ],
        'cardiology': [
            'cardiac', 'heart', 'cardiovascular', 'hypertension', 'arrhythmia',
            'coronary', 'myocardial', 'atrial fibrillation', 'heart failure'
        ],
        'neurology': [
            'neurological', 'cns', 'brain', 'alzheimer', 'parkinson', 'seizure',
            'epilepsy', 'multiple sclerosis', 'stroke', 'neurodegenerative'
        ]
    }
    
    def __init__(self, extraction_method: str = "auto"):
        """
        Initialize parser with preferred extraction method.
        Options: 'pdfplumber', 'pypdf', 'pymupdf', 'auto'
        """
        self.extraction_method = extraction_method
        self._validate_dependencies()
    
    def _validate_dependencies(self):
        """Check available PDF libraries."""
        available = []
        if HAS_PDFPLUMBER:
            available.append('pdfplumber')
        if HAS_PYPDF:
            available.append('pypdf')
        if HAS_PYMUPDF:
            available.append('pymupdf')
        
        if not available:
            raise ImportError(
                "No PDF library available. Install one of: "
                "pdfplumber, pypdf, pymupdf"
            )
        
        if self.extraction_method == "auto":
            # Prefer pdfplumber for better text extraction
            if HAS_PDFPLUMBER:
                self.extraction_method = "pdfplumber"
            elif HAS_PYMUPDF:
                self.extraction_method = "pymupdf"
            else:
                self.extraction_method = "pypdf"
        
        print(f"Using PDF extraction method: {self.extraction_method}")
    
    def extract_text_pdfplumber(self, pdf_path: Path) -> tuple[str, int]:
        """Extract text using pdfplumber."""
        text_parts = []
        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
        return "\n\n".join(text_parts), page_count
    
    def extract_text_pypdf(self, pdf_path: Path) -> tuple[str, int]:
        """Extract text using pypdf."""
        reader = PdfReader(pdf_path)
        page_count = len(reader.pages)
        text_parts = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(text_parts), page_count
    
    def extract_text_pymupdf(self, pdf_path: Path) -> tuple[str, int]:
        """Extract text using PyMuPDF."""
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        text_parts = [page.get_text() for page in doc]
        doc.close()
        return "\n\n".join(text_parts), page_count
    
    def extract_text(self, pdf_path: Path) -> tuple[str, int]:
        """Extract text from PDF using configured method."""
        if self.extraction_method == "pdfplumber":
            return self.extract_text_pdfplumber(pdf_path)
        elif self.extraction_method == "pymupdf":
            return self.extract_text_pymupdf(pdf_path)
        else:
            return self.extract_text_pypdf(pdf_path)
    
    def extract_application_number(self, text: str) -> tuple[Optional[str], Optional[str]]:
        """Extract application number and type (NDA/BLA/ANDA)."""
        for app_type, pattern in [
            ('NDA', self.PATTERNS['nda_number']),
            ('BLA', self.PATTERNS['bla_number']),
            ('ANDA', self.PATTERNS['anda_number'])
        ]:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1), app_type
        return None, None
    
    def extract_date(self, text: str) -> Optional[str]:
        """Extract letter date."""
        match = re.search(self.PATTERNS['date'], text)
        if match:
            return match.group(0)
        return None
    
    def extract_drug_name(self, text: str, filename: str) -> Optional[str]:
        """Extract drug name from text or filename."""
        # Try from RE: line
        match = re.search(self.PATTERNS['drug_name_header'], text)
        if match:
            return match.group(1).strip()
        
        # Try from filename (common format: DrugName_NDA123456_CRL.pdf)
        name_match = re.match(r'^([A-Za-z0-9]+)_', filename)
        if name_match:
            return name_match.group(1)
        
        return None

    def detect_therapeutic_area(self, text: str) -> str:
        """
        Detect therapeutic area from CRL text using keywords and FDA division signatures.

        Priority:
        1. FDA division signatures (most reliable)
        2. Drug indication keywords (count-based threshold)

        Returns:
            'oncology', 'cardiology', 'neurology', or 'unknown'
        """
        text_lower = text.lower()

        # Check each therapeutic area
        area_scores = {}
        for area, keywords in self.THERAPEUTIC_AREA_KEYWORDS.items():
            # Count keyword occurrences
            count = sum(1 for kw in keywords if kw in text_lower)
            area_scores[area] = count

        # Threshold for classification: ≥3 keywords
        threshold = 3

        # Find area with highest score
        if area_scores:
            max_area = max(area_scores.items(), key=lambda x: x[1])
            if max_area[1] >= threshold:
                return max_area[0]

        return 'unknown'

    def categorize_deficiencies(self, text: str) -> tuple[List[str], Dict[str, int]]:
        """Identify deficiency categories present in the CRL."""
        text_lower = text.lower()
        categories = []
        keyword_counts = {}
        
        for category, keywords in self.DEFICIENCY_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in text_lower)
            if count > 0:
                categories.append(category)
                keyword_counts[category] = count
        
        return categories, keyword_counts
    
    def extract_deficiency_sections(self, text: str) -> List[Dict[str, str]]:
        """Extract individual deficiency descriptions."""
        deficiencies = []
        
        # Common patterns for numbered deficiencies
        patterns = [
            r'(\d+)\.\s+([A-Z][^.]+\.(?:[^.]+\.)*)',  # "1. Description..."
            r'•\s+([A-Z][^.]+\.(?:[^.]+\.)*)',  # Bullet points
            r'(?:Deficiency|Issue|Concern)\s*\d*[:\.]?\s*([A-Z][^.]+\.)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    deficiencies.append({
                        "number": match[0] if len(match) > 1 else None,
                        "text": match[-1].strip()
                    })
                else:
                    deficiencies.append({"number": None, "text": match.strip()})
        
        return deficiencies
    
    def analyze_severity_indicators(self, text: str) -> Dict[str, bool]:
        """Detect severity indicators in the CRL."""
        text_lower = text.lower()
        
        return {
            'has_safety_concerns': any(kw in text_lower for kw in self.DEFICIENCY_KEYWORDS['safety']),
            'has_efficacy_concerns': any(kw in text_lower for kw in self.DEFICIENCY_KEYWORDS['efficacy']),
            'has_cmc_issues': any(kw in text_lower for kw in self.DEFICIENCY_KEYWORDS['cmc_manufacturing']),
            'has_clinical_hold': 'clinical hold' in text_lower,
            'requests_new_trial': any(phrase in text_lower for phrase in [
                'additional clinical', 'new study', 'additional study',
                'confirmatory trial', 'additional trial', 'new clinical'
            ])
        }
    
    def parse_crl(self, pdf_path: Path, approval_status: str) -> CRLDocument:
        """Parse a single CRL PDF and return structured document."""
        pdf_path = Path(pdf_path)
        
        # Calculate file hash
        file_hash = hashlib.md5(pdf_path.read_bytes()).hexdigest()
        
        # Extract text
        raw_text, page_count = self.extract_text(pdf_path)
        
        # Extract metadata
        app_number, app_type = self.extract_application_number(raw_text)
        letter_date = self.extract_date(raw_text)
        drug_name = self.extract_drug_name(raw_text, pdf_path.name)
        therapeutic_area = self.detect_therapeutic_area(raw_text)

        # Categorize deficiencies
        categories, _ = self.categorize_deficiencies(raw_text)
        deficiencies = self.extract_deficiency_sections(raw_text)
        
        # Analyze severity
        severity = self.analyze_severity_indicators(raw_text)
        
        return CRLDocument(
            file_path=str(pdf_path),
            file_hash=file_hash,
            approval_status=approval_status,
            drug_name=drug_name,
            application_number=app_number,
            application_type=app_type,
            letter_date=letter_date,
            therapeutic_area=therapeutic_area,
            raw_text=raw_text,
            page_count=page_count,
            deficiencies=deficiencies,
            deficiency_categories=categories,
            **severity
        )
    
    def parse_directory(self, 
                       directory: Path, 
                       approval_status: str,
                       limit: Optional[int] = None) -> List[CRLDocument]:
        """Parse all CRL PDFs in a directory."""
        directory = Path(directory)
        documents = []
        
        pdf_files = list(directory.rglob("*.pdf"))
        if limit:
            pdf_files = pdf_files[:limit]
        
        total = len(pdf_files)
        for i, pdf_path in enumerate(pdf_files, 1):
            print(f"Parsing [{i}/{total}]: {pdf_path.name}")
            try:
                doc = self.parse_crl(pdf_path, approval_status)
                documents.append(doc)
            except Exception as e:
                print(f"  Error parsing {pdf_path.name}: {e}")
        
        return documents
    
    def save_parsed_data(self, 
                        documents: List[CRLDocument], 
                        output_path: Path,
                        include_raw_text: bool = False):
        """Save parsed documents to JSON."""
        output_path = Path(output_path)
        
        data = []
        for doc in documents:
            doc_dict = doc.to_dict()
            if not include_raw_text:
                doc_dict['raw_text'] = f"[{len(doc.raw_text)} characters]"
            data.append(doc_dict)
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"Saved {len(documents)} documents to {output_path}")


if __name__ == "__main__":
    # Example usage
    parser = CRLParser(extraction_method="auto")
    
    # Parse a single file
    # doc = parser.parse_crl(Path("sample.pdf"), "approved")
    
    # Parse directory
    # docs = parser.parse_directory(Path("data/raw/approved_crls"), "approved")
    # parser.save_parsed_data(docs, Path("data/processed/parsed_crls.json"))

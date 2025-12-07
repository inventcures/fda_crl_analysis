"""
FDA CRL LLM Analysis Module
Uses Claude API for deep semantic extraction and analysis of CRL content
"""

import os
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import hashlib

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


@dataclass
class LLMExtraction:
    """Structured extraction from LLM analysis."""
    file_hash: str
    
    # Core findings
    primary_deficiency_category: str
    all_deficiency_categories: List[str]
    deficiency_severity: str  # 'minor', 'moderate', 'major', 'critical'
    
    # Structured deficiencies
    deficiencies: List[Dict[str, str]]
    
    # Regulatory indicators
    requires_new_clinical_trial: bool
    requires_additional_data: bool
    has_manufacturing_issues: bool
    has_inspection_findings: bool
    
    # Remediation guidance
    remediation_complexity: str  # 'low', 'medium', 'high'
    estimated_class_resubmission: str  # 'Class I', 'Class II', 'Unknown'
    specific_recommendations: List[str]
    
    # Drug/application info
    therapeutic_area: Optional[str]
    mechanism_of_action: Optional[str]
    patient_population: Optional[str]
    
    # Confidence
    extraction_confidence: float
    raw_llm_response: str


EXTRACTION_PROMPT = """You are an expert FDA regulatory affairs specialist analyzing a Complete Response Letter (CRL). 
Extract structured information from this CRL text.

CRL TEXT:
{crl_text}

Analyze this CRL and provide a JSON response with the following structure:
{{
    "primary_deficiency_category": "one of: safety, efficacy, cmc_manufacturing, clinical_trial_design, bioequivalence, labeling, statistical, rems, other",
    "all_deficiency_categories": ["list of all relevant categories"],
    "deficiency_severity": "minor|moderate|major|critical",
    
    "deficiencies": [
        {{
            "category": "category name",
            "description": "brief description of the specific deficiency",
            "fda_recommendation": "what FDA recommended to address it, if stated"
        }}
    ],
    
    "requires_new_clinical_trial": true/false,
    "requires_additional_data": true/false,
    "has_manufacturing_issues": true/false,
    "has_inspection_findings": true/false,
    
    "remediation_complexity": "low|medium|high",
    "estimated_class_resubmission": "Class I|Class II|Unknown",
    "specific_recommendations": ["list of specific FDA recommendations"],
    
    "therapeutic_area": "e.g., oncology, cardiology, neurology, etc. or null if unclear",
    "mechanism_of_action": "drug mechanism if mentioned, or null",
    "patient_population": "target patient population if mentioned, or null",
    
    "extraction_confidence": 0.0-1.0
}}

Important guidelines:
- Be conservative with severity ratings - 'critical' only if drug poses serious safety risks or requires complete restart
- 'Class I' resubmission = minor issues (labeling, additional analyses); 'Class II' = major issues (new studies, significant CMC changes)
- Extract ALL distinct deficiencies mentioned
- If information is redacted or unclear, note this and lower confidence score

Respond ONLY with valid JSON, no additional text."""


COMPARATIVE_ANALYSIS_PROMPT = """You are analyzing FDA Complete Response Letters to identify patterns that distinguish 
drugs that eventually get approved vs those that don't.

I have two groups of CRLs:
1. APPROVED GROUP (drugs that were eventually approved after CRL):
{approved_summaries}

2. UNAPPROVED GROUP (drugs that were NOT approved after CRL):
{unapproved_summaries}

Analyze these patterns and provide insights in JSON format:
{{
    "discriminative_features": [
        {{
            "feature": "feature name",
            "approved_pattern": "how this appears in approved group",
            "unapproved_pattern": "how this appears in unapproved group",
            "importance": "high|medium|low",
            "explanation": "why this matters"
        }}
    ],
    
    "approval_predictors": [
        {{
            "predictor": "what predicts eventual approval",
            "confidence": 0.0-1.0,
            "reasoning": "explanation"
        }}
    ],
    
    "rejection_red_flags": [
        {{
            "red_flag": "what predicts non-approval",
            "confidence": 0.0-1.0,
            "reasoning": "explanation"
        }}
    ],
    
    "key_insights": ["list of major findings"],
    
    "recommendations_for_sponsors": ["actionable advice based on patterns"]
}}

Respond ONLY with valid JSON."""


class LLMAnalyzer:
    """Uses Claude API for deep CRL analysis."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-sonnet-4-20250514"):
        if not HAS_ANTHROPIC:
            raise ImportError("anthropic package required. Install with: pip install anthropic")
        
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY required")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model
        self.rate_limit_delay = 1.0  # seconds between calls
    
    def _call_claude(self, prompt: str, max_tokens: int = 4096) -> str:
        """Make API call to Claude."""
        message = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    
    def _parse_json_response(self, response: str) -> dict:
        """Parse JSON from Claude response."""
        # Handle potential markdown code blocks
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]
        
        return json.loads(response.strip())
    
    def analyze_single_crl(self, 
                          crl_text: str, 
                          file_hash: str,
                          max_text_length: int = 50000) -> LLMExtraction:
        """Analyze a single CRL with LLM."""
        # Truncate if needed (Claude context limits)
        if len(crl_text) > max_text_length:
            crl_text = crl_text[:max_text_length] + "\n\n[TEXT TRUNCATED]"
        
        prompt = EXTRACTION_PROMPT.format(crl_text=crl_text)
        
        try:
            response = self._call_claude(prompt)
            data = self._parse_json_response(response)
            
            return LLMExtraction(
                file_hash=file_hash,
                primary_deficiency_category=data.get("primary_deficiency_category", "unknown"),
                all_deficiency_categories=data.get("all_deficiency_categories", []),
                deficiency_severity=data.get("deficiency_severity", "unknown"),
                deficiencies=data.get("deficiencies", []),
                requires_new_clinical_trial=data.get("requires_new_clinical_trial", False),
                requires_additional_data=data.get("requires_additional_data", False),
                has_manufacturing_issues=data.get("has_manufacturing_issues", False),
                has_inspection_findings=data.get("has_inspection_findings", False),
                remediation_complexity=data.get("remediation_complexity", "unknown"),
                estimated_class_resubmission=data.get("estimated_class_resubmission", "Unknown"),
                specific_recommendations=data.get("specific_recommendations", []),
                therapeutic_area=data.get("therapeutic_area"),
                mechanism_of_action=data.get("mechanism_of_action"),
                patient_population=data.get("patient_population"),
                extraction_confidence=data.get("extraction_confidence", 0.5),
                raw_llm_response=response
            )
        
        except Exception as e:
            print(f"LLM analysis failed: {e}")
            return LLMExtraction(
                file_hash=file_hash,
                primary_deficiency_category="error",
                all_deficiency_categories=[],
                deficiency_severity="unknown",
                deficiencies=[],
                requires_new_clinical_trial=False,
                requires_additional_data=False,
                has_manufacturing_issues=False,
                has_inspection_findings=False,
                remediation_complexity="unknown",
                estimated_class_resubmission="Unknown",
                specific_recommendations=[],
                therapeutic_area=None,
                mechanism_of_action=None,
                patient_population=None,
                extraction_confidence=0.0,
                raw_llm_response=str(e)
            )
    
    def analyze_batch(self, 
                     crl_documents: List[dict],
                     output_path: Optional[Path] = None,
                     limit: Optional[int] = None) -> List[LLMExtraction]:
        """Analyze a batch of CRL documents."""
        results = []
        
        docs = crl_documents[:limit] if limit else crl_documents
        total = len(docs)
        
        for i, doc in enumerate(docs, 1):
            print(f"Analyzing [{i}/{total}]: {doc.get('drug_name', 'Unknown')}")
            
            extraction = self.analyze_single_crl(
                crl_text=doc.get('raw_text', ''),
                file_hash=doc.get('file_hash', '')
            )
            results.append(extraction)
            
            # Rate limiting
            if i < total:
                time.sleep(self.rate_limit_delay)
        
        # Save if output path provided
        if output_path:
            output_path = Path(output_path)
            with open(output_path, 'w') as f:
                json.dump([asdict(r) for r in results], f, indent=2)
            print(f"Saved {len(results)} extractions to {output_path}")
        
        return results
    
    def comparative_analysis(self,
                            approved_extractions: List[dict],
                            unapproved_extractions: List[dict]) -> dict:
        """Run comparative analysis between approved and unapproved CRLs."""
        
        # Create summaries for prompt
        def summarize(extractions: List[dict], max_items: int = 20) -> str:
            summaries = []
            for ext in extractions[:max_items]:
                summary = f"""
Drug: {ext.get('drug_name', 'Unknown')}
Primary Issue: {ext.get('primary_deficiency_category', 'Unknown')}
Severity: {ext.get('deficiency_severity', 'Unknown')}
Requires New Trial: {ext.get('requires_new_clinical_trial', False)}
Manufacturing Issues: {ext.get('has_manufacturing_issues', False)}
Complexity: {ext.get('remediation_complexity', 'Unknown')}
Therapeutic Area: {ext.get('therapeutic_area', 'Unknown')}
"""
                summaries.append(summary)
            return "\n---\n".join(summaries)
        
        approved_summary = summarize(approved_extractions)
        unapproved_summary = summarize(unapproved_extractions)
        
        prompt = COMPARATIVE_ANALYSIS_PROMPT.format(
            approved_summaries=approved_summary,
            unapproved_summaries=unapproved_summary
        )
        
        response = self._call_claude(prompt, max_tokens=4096)
        return self._parse_json_response(response)


class DeficiencyTaxonomy:
    """Standardized taxonomy for CRL deficiencies."""
    
    TAXONOMY = {
        "safety": {
            "adverse_events": ["serious adverse event", "sae", "death", "mortality"],
            "toxicity": ["toxicity", "toxic", "hepatotoxicity", "cardiotoxicity", "nephrotoxicity"],
            "drug_interactions": ["drug interaction", "drug-drug", "cyp450"],
            "special_populations": ["pediatric", "geriatric", "pregnancy", "renal impairment", "hepatic impairment"],
            "long_term_safety": ["long-term", "chronic", "carcinogenicity", "genotoxicity"]
        },
        "efficacy": {
            "primary_endpoint": ["primary endpoint", "primary efficacy", "failed to meet"],
            "clinical_benefit": ["clinical benefit", "meaningful improvement", "clinically significant"],
            "response_rate": ["response rate", "orr", "complete response", "partial response"],
            "survival": ["overall survival", "progression-free", "pfs", "os"],
            "durability": ["duration of response", "dor", "durability"]
        },
        "cmc_manufacturing": {
            "process": ["manufacturing process", "scale-up", "process validation", "batch record"],
            "facility": ["facility", "cgmp", "gmp", "inspection", "483"],
            "quality": ["quality control", "specification", "out of specification", "oos"],
            "stability": ["stability", "shelf life", "degradation", "storage"],
            "analytical": ["analytical method", "validation", "assay", "impurity"]
        },
        "clinical_trial": {
            "design": ["trial design", "study design", "protocol"],
            "population": ["patient population", "inclusion", "exclusion", "heterogeneity"],
            "control": ["control group", "comparator", "placebo", "active control"],
            "conduct": ["protocol deviation", "good clinical practice", "gcp"],
            "statistical": ["statistical analysis", "multiplicity", "missing data", "sensitivity"]
        }
    }
    
    @classmethod
    def classify_deficiency(cls, text: str) -> List[tuple]:
        """Classify deficiency text into taxonomy categories."""
        text_lower = text.lower()
        matches = []
        
        for category, subcategories in cls.TAXONOMY.items():
            for subcat, keywords in subcategories.items():
                for keyword in keywords:
                    if keyword in text_lower:
                        matches.append((category, subcat, keyword))
        
        return matches
    
    @classmethod
    def get_category_distribution(cls, deficiencies: List[str]) -> Dict[str, Dict[str, int]]:
        """Get distribution of categories across deficiencies."""
        distribution = {cat: {} for cat in cls.TAXONOMY}
        
        for deficiency in deficiencies:
            matches = cls.classify_deficiency(deficiency)
            for category, subcat, _ in matches:
                distribution[category][subcat] = distribution[category].get(subcat, 0) + 1
        
        return distribution


if __name__ == "__main__":
    # Example usage
    # analyzer = LLMAnalyzer()
    
    # Single analysis
    # result = analyzer.analyze_single_crl(crl_text, file_hash)
    
    # Batch analysis
    # results = analyzer.analyze_batch(documents, output_path=Path("extractions.json"))
    
    # Comparative analysis
    # comparison = analyzer.comparative_analysis(approved_data, unapproved_data)
    pass

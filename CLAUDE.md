# CLAUDE.md - FDA CRL Analysis Project

> This file provides context for Claude Code to effectively work on this project.

## Project Overview

This project analyzes FDA Complete Response Letters (CRLs) to extract insights about drug approval patterns. CRLs are letters sent by the FDA to drug sponsors explaining why their application cannot be approved in its current form. The OpenFDA database now contains ~200 approved and ~89 unapproved CRLs from 2020-2025.

**Primary goal:** Identify patterns that distinguish drugs that eventually get approved after receiving a CRL vs. those that don't.

**Target users:** Drug developers, regulatory affairs professionals, biotech investors, academic researchers.

## Architecture

```
fda_crl_analysis/
├── main.py                 # CLI entry point, orchestrates pipeline
├── src/
│   ├── __init__.py
│   ├── data_acquisition.py # Downloads from OpenFDA (ZIP files + API)
│   ├── pdf_parser.py       # PDF text extraction, regex-based parsing
│   ├── llm_analysis.py     # Claude API for semantic extraction
│   ├── analysis.py         # Pandas/sklearn analysis, matplotlib viz
│   └── language_analysis.py # NLP, sentiment, embeddings, latent space viz
├── data/
│   ├── raw/               # Downloaded PDFs (gitignored)
│   └── processed/         # Parsed JSON data
├── outputs/               # Generated visualizations and reports
│   └── language/          # Language analysis outputs
├── notebooks/             # Jupyter notebooks for exploration
└── requirements.txt
```

### Module Dependencies

```
data_acquisition.py  →  Downloads PDFs
        ↓
pdf_parser.py        →  Extracts text, identifies deficiencies
        ↓
llm_analysis.py      →  Deep semantic extraction (optional)
        ↓
analysis.py          →  Statistical analysis, ML, visualization
        ↓
language_analysis.py →  NLP, sentiment, embeddings, latent space
```

## Key Data Structures

### CRLDocument (pdf_parser.py)
```python
@dataclass
class CRLDocument:
    file_path: str
    file_hash: str
    approval_status: str  # 'approved' or 'unapproved'
    drug_name: Optional[str]
    application_number: Optional[str]  # e.g., "123456"
    application_type: Optional[str]    # "NDA", "BLA", "ANDA"
    letter_date: Optional[str]
    raw_text: str
    page_count: int
    deficiencies: List[Dict[str, str]]
    deficiency_categories: List[str]   # From DEFICIENCY_KEYWORDS
    has_safety_concerns: bool
    has_efficacy_concerns: bool
    has_cmc_issues: bool
    has_clinical_hold: bool
    requests_new_trial: bool
```

### LLMExtraction (llm_analysis.py)
```python
@dataclass
class LLMExtraction:
    file_hash: str
    primary_deficiency_category: str
    all_deficiency_categories: List[str]
    deficiency_severity: str  # 'minor', 'moderate', 'major', 'critical'
    deficiencies: List[Dict[str, str]]
    requires_new_clinical_trial: bool
    requires_additional_data: bool
    has_manufacturing_issues: bool
    remediation_complexity: str  # 'low', 'medium', 'high'
    estimated_class_resubmission: str  # 'Class I', 'Class II'
    therapeutic_area: Optional[str]
    extraction_confidence: float
```

## Coding Conventions

### Style
- Python 3.10+ type hints throughout
- Dataclasses for structured data
- pathlib.Path over string paths
- f-strings for formatting
- Docstrings for all public functions

### Error Handling
- Graceful degradation when PDFs fail to parse
- Continue processing batch even if individual files fail
- Log errors but don't crash pipeline
- Return empty/default values rather than raising for missing data

### File I/O
- All data files are JSON (not pickle) for portability
- Raw text can be excluded from output to save space
- Use file hashes (MD5) as unique identifiers

## Common Tasks

### Adding a New Deficiency Category

1. Add keywords to `CRLParser.DEFICIENCY_KEYWORDS` in `pdf_parser.py`:
```python
DEFICIENCY_KEYWORDS = {
    # ... existing categories ...
    'new_category': [
        'keyword1', 'keyword2', 'specific phrase'
    ]
}
```

2. Add to `CRLAnalyzer.DEFICIENCY_CATEGORIES` in `analysis.py`:
```python
DEFICIENCY_CATEGORIES = [
    # ... existing ...
    'new_category'
]
```

3. The feature matrix builder will automatically include it.

### Adding a New Visualization

Add method to `CRLAnalyzer` class in `analysis.py`:
```python
def plot_new_visualization(self, save_path: Optional[Path] = None):
    """Describe what this visualizes."""
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Your plotting code here
    
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()
    return fig
```

Then add to `generate_full_analysis()` method.

### Adding a New ML Model

In `build_approval_classifier()` in `analysis.py`:
```python
models = {
    # ... existing models ...
    'New Model': NewModelClass(hyperparams)
}
```

The evaluation loop handles everything else automatically.

### Modifying LLM Extraction

1. Update `EXTRACTION_PROMPT` in `llm_analysis.py` with new fields
2. Update `LLMExtraction` dataclass to match
3. Update field mapping in `analyze_single_crl()` method

## Language Analysis Module (language_analysis.py)

This module provides advanced NLP and visualization capabilities:

### Key Classes

**FDALanguagePatterns** - Curated lexicons for regulatory text:
- `SEVERITY_LEXICON`: Maps phrases to severity scores (0-1)
- `ACTION_LEXICON`: Maps phrases to action types (major_study, data_request, etc.)
- `CERTAINTY_LEXICON`: Maps modal verbs to certainty scores
- `DOMAIN_TERMS`: Groups terms by regulatory domain

**FDASentimentAnalyzer** - Calculates FDA-specific sentiment:
```python
analyzer = FDASentimentAnalyzer()
result = analyzer.analyze_document(text)
# Returns: severity, certainty, actions, textblob sentiment
```

**CRLTextVisualizer** - Literal text visualizations:
- `plot_comparative_wordcloud()` - Side-by-side approved/unapproved
- `plot_severity_wordcloud()` - Colored by FDA severity
- `plot_ngram_comparison()` - Top n-grams by outcome
- `plot_severity_distribution()` - Histogram + boxplot
- `plot_action_type_radar()` - Radar chart of FDA requests
- `plot_sentiment_trajectory()` - Sentiment through document

**CRLLatentSpaceVisualizer** - Embedding visualizations:
- `plot_tsne_embeddings()` - t-SNE colored by approval
- `plot_umap_embeddings()` - UMAP projection
- `plot_cluster_analysis()` - K-means with topic labels
- `plot_topic_model()` - LDA topic modeling
- `plot_severity_embedding_landscape()` - Severity in latent space

### Adding New FDA Language Patterns

1. Add to appropriate lexicon in `FDALanguagePatterns`:
```python
SEVERITY_LEXICON = {
    # ... existing ...
    'new phrase': 0.75,  # severity score 0-1
}
```

2. Patterns are automatically used by `FDASentimentAnalyzer`

### Adding New Visualization

Follow the pattern in existing methods:
```python
def plot_new_viz(self, documents: List[Dict], save_path: Optional[Path] = None) -> plt.Figure:
    # Filter valid documents
    valid_docs = [d for d in documents if d.get('raw_text')]
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Your visualization logic
    
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    
    return fig
```

Then add to `CRLLanguageAnalysisSuite.run_full_analysis()`.

## API Keys and Environment

### Anthropic API (for LLM analysis)
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or pass via CLI:
```bash
python main.py --llm-analyze --api-key "sk-ant-..."
```

### Rate Limiting
- LLM calls have 1 second delay between requests
- OpenFDA API has no auth but be respectful (no parallel hammering)

## Testing Approach

### Manual Testing Commands
```bash
# Test download only
python main.py --download --data-dir test_data/

# Test parsing with small sample
python main.py --parse --data-dir test_data/ --limit 5

# Test analysis with existing data
python main.py --analyze --parsed-data data/processed/parsed_crls.json

# Full pipeline dry run
python main.py --download --parse --analyze --limit 10
```

### Validation Checks
- After parsing: Check that `deficiency_categories` is non-empty for most docs
- After analysis: Verify visualizations render without errors
- Check classifier achieves >60% accuracy (baseline is ~50% for balanced data)

## Known Issues and Pitfalls

### PDF Extraction
- **Heavy redactions:** Many CRLs have [REDACTED] blocks that break text flow
- **OCR quality:** Older PDFs may have poor OCR, test with multiple libraries
- **Nested folders:** ZIP extraction may create nested directories, use rglob

### Data Quality
- **Imbalanced classes:** More approved than unapproved CRLs currently
- **Selection bias:** Unapproved CRLs are recent (2024-2025), approved span 2020-2024
- **Missing metadata:** Drug names often not extractable from text

### Analysis Caveats
- **Small N:** ~300 total CRLs limits statistical power
- **Feature correlation:** Many deficiency types co-occur, watch for multicollinearity
- **Temporal confounding:** FDA standards may have changed over time

## Extension Ideas

### High Priority
1. **Drugs@FDA Integration:** Link CRLs to approval dates for time-to-resolution analysis
2. **Facility network analysis:** Extract CMO names, find repeat offenders
3. **Semantic embeddings:** Use Claude to generate embeddings for similarity search

### Medium Priority
4. **Time series:** Track deficiency patterns over years
5. **Sponsor analysis:** Which companies have best/worst rescue rates?
6. **Therapeutic area deep dive:** Oncology vs. CNS vs. cardiovascular patterns

### Lower Priority
7. **Web dashboard:** Streamlit/Gradio interface for interactive exploration
8. **Risk calculator:** Input drug characteristics, get CRL probability
9. **SEC filing integration:** Compare CRL content to press releases

## Useful Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run full pipeline (includes language analysis)
python main.py --download --parse --analyze --language

# Run with LLM (costs ~$0.50 for full corpus)
python main.py --download --parse --llm-analyze --analyze --language

# Quick test
python main.py --parse --analyze --limit 20

# Language analysis only (requires parsed data with raw text)
python main.py --language --parsed-data data/processed/parsed_crls.json

# Re-parse with raw text for language analysis
python main.py --parse --include-raw-text

# Jupyter exploration
jupyter notebook notebooks/exploratory_analysis.ipynb
```

## Data Sources

| Source | URL | Notes |
|--------|-----|-------|
| Approved CRLs ZIP | https://download.open.fda.gov/approved_CRLs.zip | ~200 PDFs |
| Unapproved CRLs ZIP | https://download.open.fda.gov/unapproved_CRLs.zip | ~89 PDFs |
| CRL Table UI | https://open.fda.gov/crltable/ | Searchable interface |
| OpenFDA CRL API | https://api.fda.gov/other/crl.json | JSON metadata |
| Drugs@FDA | https://www.accessdata.fda.gov/scripts/cder/daf/ | For approval dates |

## Context for LLM Analysis

When using Claude API to analyze CRLs, the key extraction targets are:

1. **Deficiency severity** - How serious does FDA consider this?
   - Look for: "cannot determine", "serious concern", "unacceptable"
   - vs: "minor", "clarification needed", "additional information"

2. **Remediation path** - What does FDA want sponsor to do?
   - Class I indicators: labeling changes, additional analyses
   - Class II indicators: new studies, facility inspection resolution

3. **FDA confidence** - Is this a soft "no" or hard "no"?
   - Soft: "recommend", "suggest", "may consider"
   - Hard: "must", "required", "cannot approve without"

4. **Implicit outcome prediction** - Language patterns that correlate with rescue
   - Positive: Specific recommendations, clear path forward
   - Negative: Vague concerns, fundamental efficacy questions

## File Size Expectations

| File | Expected Size |
|------|---------------|
| approved_CRLs.zip | ~50-100 MB |
| unapproved_CRLs.zip | ~20-50 MB |
| parsed_crls.json (with text) | ~30-50 MB |
| parsed_crls.json (no text) | ~1-2 MB |
| llm_extractions.json | ~500 KB |
| Each visualization | ~100-300 KB |

## Questions to Keep in Mind

When implementing features, consider:

1. **Will this help a drug developer make better decisions?**
2. **Is this analysis statistically valid given the sample size?**
3. **Could this reveal proprietary information that shouldn't be exposed?**
4. **Is the interpretation of FDA language defensible?**

## Contact / Resources

- OpenFDA docs: https://open.fda.gov/apis/
- FDA CRL policy: https://www.fda.gov/news-events/press-announcements/fda-embraces-radical-transparency-publishing-complete-response-letters
- 2015 BMJ CRL analysis: DOI 10.1136/bmj.h2758

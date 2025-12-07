#!/usr/bin/env python3
"""
FDA CRL Analysis Pipeline - Main Runner
=======================================

Orchestrates the complete pipeline:
1. Download CRL PDFs from OpenFDA
2. Parse and extract structured data from PDFs
3. Run LLM-based deep analysis (optional)
4. Generate statistical analyses and visualizations
5. Build predictive models

Usage:
    python main.py --download --parse --analyze --output outputs/
    python main.py --parse-only --data-dir data/raw/approved_crls
    python main.py --llm-analyze --api-key YOUR_API_KEY
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from data_acquisition import CRLDataAcquisition
from pdf_parser import CRLParser, CRLDocument
from analysis import CRLAnalyzer
from language_analysis import CRLLanguageAnalysisSuite


def run_download(data_dir: str, force: bool = False):
    """Download CRL data from OpenFDA."""
    print("\n" + "="*60)
    print("STEP 1: DOWNLOADING CRL DATA")
    print("="*60)
    
    acq = CRLDataAcquisition(data_dir=data_dir)
    results = acq.download_and_extract_all(force=force)
    manifest = acq.create_manifest()
    
    return results, manifest


def run_parse(data_dir: str, 
              output_path: str,
              extraction_method: str = "auto",
              limit: int = None,
              include_raw_text: bool = False):
    """Parse CRL PDFs and extract structured data."""
    print("\n" + "="*60)
    print("STEP 2: PARSING CRL PDFs")
    print("="*60)
    
    data_path = Path(data_dir)
    parser = CRLParser(extraction_method=extraction_method)
    
    all_documents = []
    
    # Parse approved CRLs
    approved_dir = data_path / "raw" / "approved_crls"
    if approved_dir.exists():
        print(f"\nParsing approved CRLs from: {approved_dir}")
        approved_docs = parser.parse_directory(approved_dir, "approved", limit=limit)
        all_documents.extend(approved_docs)
    
    # Parse unapproved CRLs
    unapproved_dir = data_path / "raw" / "unapproved_crls"
    if unapproved_dir.exists():
        print(f"\nParsing unapproved CRLs from: {unapproved_dir}")
        unapproved_docs = parser.parse_directory(unapproved_dir, "unapproved", limit=limit)
        all_documents.extend(unapproved_docs)
    
    # Save parsed data
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    parser.save_parsed_data(all_documents, output_path, include_raw_text=include_raw_text)
    
    print(f"\nTotal documents parsed: {len(all_documents)}")
    print(f"  Approved: {len([d for d in all_documents if d.approval_status == 'approved'])}")
    print(f"  Unapproved: {len([d for d in all_documents if d.approval_status == 'unapproved'])}")
    
    return all_documents


def run_llm_analysis(parsed_data_path: str,
                     output_path: str,
                     api_key: str = None,
                     limit: int = None):
    """Run LLM-based deep analysis."""
    print("\n" + "="*60)
    print("STEP 3: LLM-BASED DEEP ANALYSIS")
    print("="*60)
    
    try:
        from llm_analysis import LLMAnalyzer
    except ImportError as e:
        print(f"Could not import LLM analyzer: {e}")
        print("Skipping LLM analysis. Install anthropic: pip install anthropic")
        return None
    
    # Load parsed data
    with open(parsed_data_path) as f:
        documents = json.load(f)
    
    analyzer = LLMAnalyzer(api_key=api_key)
    extractions = analyzer.analyze_batch(
        documents, 
        output_path=Path(output_path),
        limit=limit
    )
    
    return extractions


def run_analysis(parsed_data_path: str, output_dir: str):
    """Run statistical analysis and generate visualizations."""
    print("\n" + "="*60)
    print("STEP 4: STATISTICAL ANALYSIS & VISUALIZATION")
    print("="*60)
    
    analyzer = CRLAnalyzer(data_path=Path(parsed_data_path))
    summary = analyzer.generate_full_analysis(output_dir=Path(output_dir))
    
    return summary


def run_language_analysis(parsed_data_path: str, output_dir: str):
    """Run language and sentiment analysis with visualizations."""
    print("\n" + "="*60)
    print("STEP 5: LANGUAGE & SENTIMENT ANALYSIS")
    print("="*60)
    
    # Load parsed data with full text
    with open(parsed_data_path) as f:
        documents = json.load(f)
    
    # Check if we have raw text
    has_text = sum(1 for d in documents if d.get('raw_text') and len(d.get('raw_text', '')) > 100)
    if has_text < 10:
        print(f"Warning: Only {has_text} documents have raw text. Re-parse with --include-raw-text")
        return None
    
    suite = CRLLanguageAnalysisSuite()
    language_output = Path(output_dir) / "language"
    results = suite.run_full_analysis(documents, output_dir=language_output)
    
    return results


def print_summary_report(summary: dict):
    """Print a summary report to console."""
    print("\n" + "="*60)
    print("ANALYSIS SUMMARY REPORT")
    print("="*60)
    
    print(f"\n📊 Dataset Overview:")
    print(f"   Total CRLs: {summary['n_total']}")
    print(f"   Eventually Approved: {summary['n_approved']}")
    print(f"   Not Approved: {summary['n_unapproved']}")
    
    print(f"\n📋 Top Deficiency Categories:")
    sorted_deficiencies = sorted(
        summary['deficiency_frequencies'].items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    for cat, count in sorted_deficiencies[:5]:
        print(f"   • {cat}: {count}")
    
    print(f"\n🎯 Classifier Performance (Best Model):")
    best_model = max(
        summary['classifier_performance'].items(),
        key=lambda x: x[1]['cv_mean']
    )
    print(f"   Model: {best_model[0]}")
    print(f"   CV Accuracy: {best_model[1]['cv_mean']:.1%} (±{best_model[1]['cv_std']:.1%})")
    
    print(f"\n⚠️ Statistically Significant Features:")
    for feature in summary['significant_features'][:5]:
        print(f"   • {feature}")
    
    print(f"\n💊 Rescue Rates (Top 3 - Highest Chance of Recovery):")
    for rate_info in summary['rescue_rates'][:3]:
        print(f"   • {rate_info['category']}: {rate_info['rescue_rate']:.1%}")


def main():
    parser = argparse.ArgumentParser(
        description="FDA CRL Analysis Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full pipeline
  python main.py --download --parse --analyze

  # Download only
  python main.py --download --data-dir data/

  # Parse existing PDFs
  python main.py --parse --data-dir data/

  # Run LLM analysis (requires API key)
  python main.py --llm-analyze --api-key sk-ant-...

  # Analysis only (requires parsed data)
  python main.py --analyze --parsed-data data/processed/parsed_crls.json
        """
    )
    
    # Pipeline stages
    parser.add_argument("--download", action="store_true", help="Download CRL PDFs")
    parser.add_argument("--parse", action="store_true", help="Parse CRL PDFs")
    parser.add_argument("--llm-analyze", action="store_true", help="Run LLM deep analysis")
    parser.add_argument("--analyze", action="store_true", help="Run statistical analysis")
    parser.add_argument("--language", action="store_true", help="Run language & sentiment analysis")
    
    # Configuration
    parser.add_argument("--data-dir", default="data", help="Data directory (default: data)")
    parser.add_argument("--output-dir", default="outputs", help="Output directory (default: outputs)")
    parser.add_argument("--parsed-data", default=None, help="Path to parsed data JSON")
    parser.add_argument("--api-key", default=None, help="Anthropic API key for LLM analysis")
    
    # Options
    parser.add_argument("--force", action="store_true", help="Force re-download")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of documents")
    parser.add_argument("--include-raw-text", action="store_true", help="Include raw text in output")
    parser.add_argument("--extraction-method", default="auto", 
                       choices=["auto", "pdfplumber", "pypdf", "pymupdf"],
                       help="PDF extraction method")
    
    args = parser.parse_args()
    
    # Default: run all stages if none specified
    if not any([args.download, args.parse, args.llm_analyze, args.analyze, args.language]):
        args.download = True
        args.parse = True
        args.analyze = True
        args.language = True
    
    print("\n" + "="*60)
    print("FDA COMPLETE RESPONSE LETTER ANALYSIS PIPELINE")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Create directories
    Path(args.data_dir).mkdir(parents=True, exist_ok=True)
    Path(args.output_dir).mkdir(parents=True, exist_ok=True)
    
    parsed_data_path = args.parsed_data or Path(args.data_dir) / "processed" / "parsed_crls.json"
    
    # Stage 1: Download
    if args.download:
        run_download(args.data_dir, force=args.force)
    
    # Stage 2: Parse
    if args.parse:
        run_parse(
            data_dir=args.data_dir,
            output_path=parsed_data_path,
            extraction_method=args.extraction_method,
            limit=args.limit,
            include_raw_text=args.include_raw_text
        )
    
    # Stage 3: LLM Analysis (optional)
    if args.llm_analyze:
        llm_output = Path(args.output_dir) / "llm_extractions.json"
        run_llm_analysis(
            parsed_data_path=str(parsed_data_path),
            output_path=str(llm_output),
            api_key=args.api_key,
            limit=args.limit
        )
    
    # Stage 4: Statistical Analysis
    if args.analyze:
        if not Path(parsed_data_path).exists():
            print(f"\nError: Parsed data not found at {parsed_data_path}")
            print("Run with --parse first, or specify --parsed-data path")
            sys.exit(1)
        
        summary = run_analysis(
            parsed_data_path=str(parsed_data_path),
            output_dir=args.output_dir
        )
        
        # Print summary report
        print_summary_report(summary)
    
    # Stage 5: Language & Sentiment Analysis
    if args.language:
        if not Path(parsed_data_path).exists():
            print(f"\nError: Parsed data not found at {parsed_data_path}")
            print("Run with --parse first, or specify --parsed-data path")
            sys.exit(1)
        
        language_results = run_language_analysis(
            parsed_data_path=str(parsed_data_path),
            output_dir=args.output_dir
        )
    
    print("\n" + "="*60)
    print(f"Pipeline complete! Results saved to: {args.output_dir}/")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()

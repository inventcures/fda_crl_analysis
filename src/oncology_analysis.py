"""
Oncology-Specific CRL Analysis
================================

Specialized analysis for oncology Complete Response Letters,
including common approval/rejection hypothesis detection.
"""

from typing import Dict, List, Any
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np


class OncologyHypothesisAnalyzer:
    """
    Analyze common approval/rejection hypotheses in oncology CRLs.

    This class categorizes oncology CRLs by common deficiency patterns
    and tracks actual vs. expected rescue rates for different hypotheses.
    """

    APPROVAL_HYPOTHESES = {
        'manufacturing_only': {
            'pattern': lambda doc: doc.get('has_cmc_issues', False) and not doc.get('has_efficacy_concerns', False),
            'expected_rescue_rate': 0.90,
            'label': 'Manufacturing Issues Only'
        },
        'dose_optimization': {
            'pattern': lambda doc: 'dose optimization' in doc.get('raw_text', '').lower() or 'dosing' in doc.get('raw_text', '').lower(),
            'expected_rescue_rate': 0.85,
            'label': 'Dose Optimization Required'
        },
        'biomarker_validation': {
            'pattern': lambda doc: 'biomarker' in doc.get('raw_text', '').lower(),
            'expected_rescue_rate': 0.75,
            'label': 'Biomarker Validation Needed'
        },
        'labeling_only': {
            'pattern': lambda doc: 'labeling' in doc.get('deficiency_categories', []) and not doc.get('has_safety_concerns', False) and not doc.get('has_efficacy_concerns', False),
            'expected_rescue_rate': 0.95,
            'label': 'Labeling Changes Only'
        }
    }

    REJECTION_HYPOTHESES = {
        'efficacy_failure': {
            'pattern': lambda doc: 'failed to demonstrate' in doc.get('raw_text', '').lower() or ('efficacy' in doc.get('deficiency_categories', []) and doc.get('has_efficacy_concerns', False)),
            'expected_rescue_rate': 0.15,
            'label': 'Failed Efficacy Demonstration'
        },
        'unacceptable_toxicity': {
            'pattern': lambda doc: 'cardiotoxicity' in doc.get('raw_text', '').lower() or 'unacceptable toxicity' in doc.get('raw_text', '').lower(),
            'expected_rescue_rate': 0.20,
            'label': 'Unacceptable Cardiotoxicity'
        },
        'new_trial_required': {
            'pattern': lambda doc: doc.get('requests_new_trial', False),
            'expected_rescue_rate': 0.25,
            'label': 'New Trial Required'
        },
        'survival_benefit_lacking': {
            'pattern': lambda doc: 'survival' in doc.get('raw_text', '').lower() and ('insufficient' in doc.get('raw_text', '').lower() or 'failed' in doc.get('raw_text', '').lower()),
            'expected_rescue_rate': 0.10,
            'label': 'Insufficient Survival Benefit'
        }
    }

    def analyze_hypotheses(self, oncology_crls: List[Dict]) -> Dict[str, Any]:
        """
        Categorize oncology CRLs by approval/rejection hypothesis.

        Args:
            oncology_crls: List of oncology CRL documents (as dicts)

        Returns:
            Dictionary with hypothesis analysis results
        """
        results = {
            'approval_hypotheses': {},
            'rejection_hypotheses': {}
        }

        # Analyze approval hypotheses
        for hyp_name, hyp_def in self.APPROVAL_HYPOTHESES.items():
            try:
                matching = [doc for doc in oncology_crls if hyp_def['pattern'](doc)]
                approved = sum(1 for doc in matching if doc.get('approval_status') == 'approved')

                results['approval_hypotheses'][hyp_name] = {
                    'label': hyp_def['label'],
                    'count': len(matching),
                    'approved': approved,
                    'unapproved': len(matching) - approved,
                    'actual_rescue_rate': approved / len(matching) if matching else 0,
                    'expected_rescue_rate': hyp_def['expected_rescue_rate']
                }
            except Exception as e:
                print(f"Warning: Error analyzing hypothesis '{hyp_name}': {e}")
                results['approval_hypotheses'][hyp_name] = {
                    'label': hyp_def['label'],
                    'count': 0,
                    'approved': 0,
                    'unapproved': 0,
                    'actual_rescue_rate': 0,
                    'expected_rescue_rate': hyp_def['expected_rescue_rate']
                }

        # Analyze rejection hypotheses
        for hyp_name, hyp_def in self.REJECTION_HYPOTHESES.items():
            try:
                matching = [doc for doc in oncology_crls if hyp_def['pattern'](doc)]
                approved = sum(1 for doc in matching if doc.get('approval_status') == 'approved')

                results['rejection_hypotheses'][hyp_name] = {
                    'label': hyp_def['label'],
                    'count': len(matching),
                    'approved': approved,
                    'unapproved': len(matching) - approved,
                    'actual_rescue_rate': approved / len(matching) if matching else 0,
                    'expected_rescue_rate': hyp_def['expected_rescue_rate']
                }
            except Exception as e:
                print(f"Warning: Error analyzing hypothesis '{hyp_name}': {e}")
                results['rejection_hypotheses'][hyp_name] = {
                    'label': hyp_def['label'],
                    'count': 0,
                    'approved': 0,
                    'unapproved': 0,
                    'actual_rescue_rate': 0,
                    'expected_rescue_rate': hyp_def['expected_rescue_rate']
                }

        return results

    def plot_hypothesis_comparison(self, results: Dict, save_path: Path):
        """
        Create bar chart comparing expected vs. actual rescue rates
        for common oncology approval/rejection hypotheses.

        Args:
            results: Output from analyze_hypotheses()
            save_path: Path to save the visualization
        """
        # Extract data
        hypotheses = []
        expected = []
        actual = []
        counts = []

        # Collect approval hypotheses
        for hyp_name, hyp_data in results['approval_hypotheses'].items():
            if hyp_data['count'] > 0:  # Only include if we have data
                hypotheses.append(hyp_data['label'])
                expected.append(hyp_data['expected_rescue_rate'] * 100)
                actual.append(hyp_data['actual_rescue_rate'] * 100)
                counts.append(hyp_data['count'])

        # Collect rejection hypotheses
        for hyp_name, hyp_data in results['rejection_hypotheses'].items():
            if hyp_data['count'] > 0:  # Only include if we have data
                hypotheses.append(hyp_data['label'])
                expected.append(hyp_data['expected_rescue_rate'] * 100)
                actual.append(hyp_data['actual_rescue_rate'] * 100)
                counts.append(hyp_data['count'])

        if not hypotheses:
            print("No hypothesis data to plot")
            return

        # Create grouped bar chart
        fig, ax = plt.subplots(figsize=(14, 8))
        x = np.arange(len(hypotheses))
        width = 0.35

        bars1 = ax.bar(x - width/2, expected, width, label='Expected Rescue Rate',
                      color='#005ea2', alpha=0.8)
        bars2 = ax.bar(x + width/2, actual, width, label='Actual Rescue Rate',
                      color='#00a91c', alpha=0.8)

        # Add count labels on top of bars
        for i, (bar1, bar2, count) in enumerate(zip(bars1, bars2, counts)):
            height = max(bar1.get_height(), bar2.get_height())
            ax.text(i, height + 3, f'n={count}', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')

        ax.set_xlabel('Hypothesis', fontsize=12, fontweight='bold')
        ax.set_ylabel('Rescue Rate (%)', fontsize=12, fontweight='bold')
        ax.set_title('Oncology CRL: Common Approval/Rejection Hypotheses\nExpected vs. Actual Rescue Rates',
                    fontsize=14, fontweight='bold', pad=20)
        ax.set_xticks(x)
        ax.set_xticklabels(hypotheses, rotation=45, ha='right', fontsize=10)
        ax.legend(fontsize=11)
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        ax.set_ylim(0, 105)

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

        print(f"Saved hypothesis comparison to {save_path}")

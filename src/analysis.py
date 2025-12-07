"""
FDA CRL Analysis & Visualization Module
Statistical analysis, predictive modeling, and visualization of CRL data
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd

# Academic visualization style (apply before any plotting)
import sys
sys.path.append(str(Path(__file__).parent.parent))
import viz_style

# Visualization
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns

# Machine Learning
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_curve, auc,
    precision_recall_curve, average_precision_score
)

# Statistical tests
from scipy import stats


class CRLAnalyzer:
    """Main analysis class for FDA CRL data."""
    
    DEFICIENCY_CATEGORIES = [
        'safety', 'efficacy', 'cmc_manufacturing', 'clinical_trial_design',
        'bioequivalence', 'labeling', 'statistical', 'rems', 'oncology_specific'
    ]
    
    def __init__(self, data_path: Optional[Path] = None, therapeutic_area_filter: Optional[str] = None):
        self.data = None
        self.df = None
        self.therapeutic_area_filter = therapeutic_area_filter
        if data_path:
            self.load_data(data_path)

    def load_data(self, data_path: Path):
        """Load and optionally filter CRL data by therapeutic area."""
        with open(data_path) as f:
            self.data = json.load(f)
        self.df = pd.DataFrame(self.data)

        # Filter by therapeutic area if specified
        if self.therapeutic_area_filter:
            initial_count = len(self.df)
            self.df = self.df[self.df['therapeutic_area'] == self.therapeutic_area_filter]
            print(f"Filtered to {len(self.df)} {self.therapeutic_area_filter} CRLs (from {initial_count} total)")
        else:
            print(f"Loaded {len(self.df)} CRL records")
        return self.df
    
    def prepare_features(self) -> pd.DataFrame:
        """Prepare feature matrix for analysis."""
        if self.df is None:
            raise ValueError("No data loaded")
        
        features = pd.DataFrame()
        
        # Basic metadata
        features['approval_status'] = self.df['approval_status'].map({'approved': 1, 'unapproved': 0})
        features['page_count'] = self.df['page_count']
        
        # Application type encoding
        if 'application_type' in self.df.columns:
            app_type_dummies = pd.get_dummies(self.df['application_type'], prefix='app_type')
            features = pd.concat([features, app_type_dummies], axis=1)
        
        # Deficiency category flags (one-hot)
        for category in self.DEFICIENCY_CATEGORIES:
            features[f'has_{category}'] = self.df['deficiency_categories'].apply(
                lambda cats: 1 if cats and category in cats else 0
            )
        
        # Severity indicators
        features['has_safety_concerns'] = self.df['has_safety_concerns'].astype(int)
        features['has_efficacy_concerns'] = self.df['has_efficacy_concerns'].astype(int)
        features['has_cmc_issues'] = self.df['has_cmc_issues'].astype(int)
        features['has_clinical_hold'] = self.df['has_clinical_hold'].astype(int)
        features['requests_new_trial'] = self.df['requests_new_trial'].astype(int)
        
        # Derived features
        features['num_deficiency_categories'] = self.df['deficiency_categories'].apply(
            lambda x: len(x) if x else 0
        )
        features['num_deficiencies'] = self.df['deficiencies'].apply(
            lambda x: len(x) if x else 0
        )
        
        # Text length features
        features['text_length'] = self.df['raw_text'].apply(
            lambda x: len(x) if isinstance(x, str) else 0
        )
        
        return features
    
    # =========================================================================
    # ANALYSIS 1: Deficiency Frequency Analysis
    # =========================================================================
    
    def deficiency_frequency_analysis(self) -> Dict[str, Any]:
        """Analyze frequency of deficiency categories."""
        results = {
            'overall': Counter(),
            'by_status': {'approved': Counter(), 'unapproved': Counter()},
            'co_occurrence': defaultdict(lambda: defaultdict(int))
        }
        
        for _, row in self.df.iterrows():
            categories = row.get('deficiency_categories', []) or []
            status = row['approval_status']
            
            for cat in categories:
                results['overall'][cat] += 1
                results['by_status'][status][cat] += 1
            
            # Co-occurrence
            for i, cat1 in enumerate(categories):
                for cat2 in categories[i+1:]:
                    results['co_occurrence'][cat1][cat2] += 1
                    results['co_occurrence'][cat2][cat1] += 1
        
        return results
    
    def plot_deficiency_treemap(self, save_path: Optional[Path] = None):
        """Create treemap visualization of deficiency categories."""
        try:
            import squarify
        except ImportError:
            print("squarify required for treemap. Using bar chart instead.")
            return self.plot_deficiency_frequency(save_path)
        
        freq = self.deficiency_frequency_analysis()
        
        labels = list(freq['overall'].keys())
        sizes = list(freq['overall'].values())
        
        # Color by frequency
        colors = plt.cm.Reds([s/max(sizes) for s in sizes])
        
        fig, ax = plt.subplots(figsize=(12, 8))
        squarify.plot(sizes=sizes, label=labels, color=colors, alpha=0.8, ax=ax)
        ax.set_title('CRL Deficiency Categories - Treemap', fontsize=16)
        ax.axis('off')
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        return fig
    
    def plot_deficiency_frequency(self, save_path: Optional[Path] = None):
        """Bar chart of deficiency frequencies by approval status."""
        freq = self.deficiency_frequency_analysis()
        
        categories = list(freq['overall'].keys())
        approved_counts = [freq['by_status']['approved'].get(c, 0) for c in categories]
        unapproved_counts = [freq['by_status']['unapproved'].get(c, 0) for c in categories]
        
        x = np.arange(len(categories))
        width = 0.35
        
        fig, ax = plt.subplots(figsize=(14, 8))
        bars1 = ax.bar(x - width/2, approved_counts, width, label='Eventually Approved', color='#2ecc71')
        bars2 = ax.bar(x + width/2, unapproved_counts, width, label='Not Approved', color='#e74c3c')
        
        ax.set_xlabel('Deficiency Category', fontsize=12)
        ax.set_ylabel('Count', fontsize=12)
        ax.set_title('CRL Deficiency Categories by Final Approval Status', fontsize=14)
        ax.set_xticks(x)
        ax.set_xticklabels(categories, rotation=45, ha='right')
        ax.legend()
        
        # Add count labels
        for bar in bars1 + bars2:
            height = bar.get_height()
            if height > 0:
                ax.annotate(f'{int(height)}',
                           xy=(bar.get_x() + bar.get_width()/2, height),
                           xytext=(0, 3), textcoords="offset points",
                           ha='center', va='bottom', fontsize=9)
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        return fig
    
    # =========================================================================
    # ANALYSIS 2: Approved vs Unapproved Discriminative Features
    # =========================================================================
    
    def build_approval_classifier(self) -> Dict[str, Any]:
        """Build and evaluate classifier for approval prediction."""
        features = self.prepare_features()

        # Target
        y = features['approval_status']
        X = features.drop('approval_status', axis=1)

        # Handle missing values
        X = X.fillna(0)

        # Check if we have enough samples for classification
        class_counts = y.value_counts()
        min_class_size = class_counts.min()

        if min_class_size < 2:
            print(f"⚠ Insufficient data for classification: only {min_class_size} samples in minority class")
            print(f"   Class distribution: {dict(class_counts)}")
            return {
                'status': 'insufficient_data',
                'reason': f'Minority class has only {min_class_size} sample(s), need at least 2',
                'class_distribution': {int(k): int(v) for k, v in class_counts.items()}
            }

        if len(features) < 10:
            print(f"⚠ Very small dataset ({len(features)} samples) - results may be unreliable")

        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train multiple models
        models = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
        }
        
        results = {}
        for name, model in models.items():
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            y_prob = model.predict_proba(X_test_scaled)[:, 1]
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
            
            results[name] = {
                'model': model,
                'predictions': y_pred,
                'probabilities': y_prob,
                'test_accuracy': model.score(X_test_scaled, y_test),
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'classification_report': classification_report(y_test, y_pred, output_dict=True),
                'confusion_matrix': confusion_matrix(y_test, y_pred)
            }
            
            # Feature importance
            if hasattr(model, 'feature_importances_'):
                results[name]['feature_importance'] = dict(zip(X.columns, model.feature_importances_))
            elif hasattr(model, 'coef_'):
                results[name]['feature_importance'] = dict(zip(X.columns, np.abs(model.coef_[0])))
        
        return {
            'models': results,
            'feature_names': list(X.columns),
            'X_test': X_test,
            'y_test': y_test,
            'scaler': scaler
        }
    
    def plot_feature_importance(self, 
                                model_results: Dict[str, Any],
                                model_name: str = 'Random Forest',
                                top_n: int = 15,
                                save_path: Optional[Path] = None):
        """Plot feature importance from classifier."""
        importance = model_results['models'][model_name]['feature_importance']
        
        # Sort by importance
        sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:top_n]
        features, values = zip(*sorted_imp)
        
        fig, ax = plt.subplots(figsize=(10, 8))
        colors = plt.cm.RdYlGn([v/max(values) for v in values])
        
        y_pos = np.arange(len(features))
        ax.barh(y_pos, values, color=colors)
        ax.set_yticks(y_pos)
        ax.set_yticklabels(features)
        ax.invert_yaxis()
        ax.set_xlabel('Feature Importance')
        ax.set_title(f'Top {top_n} Features Predicting Approval ({model_name})')
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        return fig
    
    def plot_roc_curves(self, 
                       model_results: Dict[str, Any],
                       save_path: Optional[Path] = None):
        """Plot ROC curves for all models."""
        fig, ax = plt.subplots(figsize=(10, 8))
        
        y_test = model_results['y_test']
        
        colors = ['#3498db', '#e74c3c', '#2ecc71']
        for i, (name, results) in enumerate(model_results['models'].items()):
            y_prob = results['probabilities']
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            roc_auc = auc(fpr, tpr)
            
            ax.plot(fpr, tpr, color=colors[i], lw=2,
                   label=f'{name} (AUC = {roc_auc:.3f})')
        
        ax.plot([0, 1], [0, 1], 'k--', lw=2)
        ax.set_xlim([0.0, 1.0])
        ax.set_ylim([0.0, 1.05])
        ax.set_xlabel('False Positive Rate', fontsize=12)
        ax.set_ylabel('True Positive Rate', fontsize=12)
        ax.set_title('ROC Curves - Approval Prediction', fontsize=14)
        ax.legend(loc='lower right')
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        return fig
    
    # =========================================================================
    # ANALYSIS 3: Rescue Rate Analysis
    # =========================================================================
    
    def calculate_rescue_rates(self) -> pd.DataFrame:
        """Calculate rescue rates by deficiency category."""
        category_outcomes = defaultdict(lambda: {'approved': 0, 'unapproved': 0})
        
        for _, row in self.df.iterrows():
            categories = row.get('deficiency_categories', []) or []
            status = row['approval_status']
            
            for cat in categories:
                category_outcomes[cat][status] += 1
        
        data = []
        for cat, outcomes in category_outcomes.items():
            total = outcomes['approved'] + outcomes['unapproved']
            if total > 0:
                rescue_rate = outcomes['approved'] / total
                data.append({
                    'category': cat,
                    'approved': outcomes['approved'],
                    'unapproved': outcomes['unapproved'],
                    'total': total,
                    'rescue_rate': rescue_rate
                })
        
        return pd.DataFrame(data).sort_values('rescue_rate', ascending=False)
    
    def plot_rescue_rates(self, save_path: Optional[Path] = None):
        """Plot rescue rates by deficiency category."""
        rates_df = self.calculate_rescue_rates()
        
        fig, ax = plt.subplots(figsize=(12, 8))
        
        colors = plt.cm.RdYlGn(rates_df['rescue_rate'])
        
        bars = ax.barh(rates_df['category'], rates_df['rescue_rate'], color=colors)
        
        # Add percentage labels
        for bar, rate, total in zip(bars, rates_df['rescue_rate'], rates_df['total']):
            ax.text(bar.get_width() + 0.02, bar.get_y() + bar.get_height()/2,
                   f'{rate:.1%} (n={total})', va='center', fontsize=10)
        
        ax.set_xlabel('Rescue Rate (Proportion Eventually Approved)', fontsize=12)
        ax.set_title('CRL "Rescue Rate" by Deficiency Category', fontsize=14)
        ax.set_xlim(0, 1.2)
        ax.axvline(x=0.5, color='red', linestyle='--', alpha=0.7, label='50% threshold')
        ax.legend()
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        return fig
    
    # =========================================================================
    # ANALYSIS 4: Co-occurrence Analysis
    # =========================================================================
    
    def plot_cooccurrence_heatmap(self, save_path: Optional[Path] = None):
        """Plot heatmap of deficiency category co-occurrence."""
        freq = self.deficiency_frequency_analysis()
        cooc = freq['co_occurrence']
        
        categories = list(freq['overall'].keys())
        matrix = np.zeros((len(categories), len(categories)))
        
        for i, cat1 in enumerate(categories):
            for j, cat2 in enumerate(categories):
                if cat1 == cat2:
                    matrix[i, j] = freq['overall'][cat1]
                else:
                    matrix[i, j] = cooc[cat1].get(cat2, 0)
        
        fig, ax = plt.subplots(figsize=(12, 10))
        
        mask = np.zeros_like(matrix, dtype=bool)
        mask[np.triu_indices_from(mask, k=1)] = True
        
        sns.heatmap(matrix, annot=True, fmt='.0f', cmap='YlOrRd',
                   xticklabels=categories, yticklabels=categories,
                   mask=mask, ax=ax, cbar_kws={'label': 'Co-occurrence Count'})
        
        ax.set_title('Deficiency Category Co-occurrence Matrix', fontsize=14)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        return fig
    
    # =========================================================================
    # ANALYSIS 5: Statistical Testing
    # =========================================================================
    
    def statistical_tests(self) -> Dict[str, Any]:
        """Run statistical tests comparing approved vs unapproved CRLs."""
        features = self.prepare_features()
        
        approved = features[features['approval_status'] == 1]
        unapproved = features[features['approval_status'] == 0]
        
        results = {}
        
        # Chi-square tests for categorical features
        binary_features = [col for col in features.columns if col.startswith('has_') or col.startswith('app_type_')]
        
        for feature in binary_features:
            contingency = pd.crosstab(features['approval_status'], features[feature])
            if contingency.shape == (2, 2):
                chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
                results[feature] = {
                    'test': 'chi-square',
                    'chi2': chi2,
                    'p_value': p_value,
                    'significant': p_value < 0.05
                }
        
        # T-tests for continuous features
        continuous_features = ['num_deficiency_categories', 'num_deficiencies', 'page_count', 'text_length']
        
        for feature in continuous_features:
            if feature in approved.columns:
                t_stat, p_value = stats.ttest_ind(
                    approved[feature].dropna(),
                    unapproved[feature].dropna()
                )
                results[feature] = {
                    'test': 't-test',
                    't_statistic': t_stat,
                    'p_value': p_value,
                    'approved_mean': approved[feature].mean(),
                    'unapproved_mean': unapproved[feature].mean(),
                    'significant': p_value < 0.05
                }
        
        return results
    
    def plot_statistical_comparison(self, save_path: Optional[Path] = None):
        """Visualize statistical comparisons."""
        test_results = self.statistical_tests()
        
        significant = [(k, v) for k, v in test_results.items() if v.get('significant', False)]
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 12))
        
        # 1. P-value comparison
        ax1 = axes[0, 0]
        features = list(test_results.keys())
        p_values = [test_results[f]['p_value'] for f in features]
        colors = ['#e74c3c' if p < 0.05 else '#95a5a6' for p in p_values]
        
        ax1.barh(features, [-np.log10(p) for p in p_values], color=colors)
        ax1.axvline(x=-np.log10(0.05), color='black', linestyle='--', label='p=0.05')
        ax1.set_xlabel('-log10(p-value)')
        ax1.set_title('Statistical Significance of Features')
        ax1.legend()
        
        # 2. Effect sizes for significant features
        ax2 = axes[0, 1]
        if significant:
            sig_names = [s[0] for s in significant]
            sig_chi2 = [s[1].get('chi2', s[1].get('t_statistic', 0)) for s in significant]
            ax2.barh(sig_names, sig_chi2, color='#3498db')
            ax2.set_xlabel('Test Statistic (χ² or t)')
            ax2.set_title('Effect Size of Significant Features')
        else:
            ax2.text(0.5, 0.5, 'No significant features', ha='center', va='center')
        
        # 3. Distribution comparison - number of deficiencies
        ax3 = axes[1, 0]
        features = self.prepare_features()
        approved = features[features['approval_status'] == 1]['num_deficiencies']
        unapproved = features[features['approval_status'] == 0]['num_deficiencies']
        
        ax3.hist(approved, bins=20, alpha=0.7, label='Approved', color='#2ecc71')
        ax3.hist(unapproved, bins=20, alpha=0.7, label='Unapproved', color='#e74c3c')
        ax3.set_xlabel('Number of Deficiencies')
        ax3.set_ylabel('Count')
        ax3.set_title('Distribution of Deficiency Count by Outcome')
        ax3.legend()
        
        # 4. Distribution comparison - categories
        ax4 = axes[1, 1]
        approved_cats = features[features['approval_status'] == 1]['num_deficiency_categories']
        unapproved_cats = features[features['approval_status'] == 0]['num_deficiency_categories']
        
        ax4.hist(approved_cats, bins=10, alpha=0.7, label='Approved', color='#2ecc71')
        ax4.hist(unapproved_cats, bins=10, alpha=0.7, label='Unapproved', color='#e74c3c')
        ax4.set_xlabel('Number of Deficiency Categories')
        ax4.set_ylabel('Count')
        ax4.set_title('Distribution of Deficiency Categories by Outcome')
        ax4.legend()
        
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        return fig
    
    # =========================================================================
    # Generate Full Report
    # =========================================================================
    
    def generate_full_analysis(self, output_dir: Path):
        """Run all analyses and save outputs."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("Running FDA CRL Analysis Pipeline...")
        
        # 1. Deficiency frequency
        print("\n1. Deficiency Frequency Analysis")
        freq = self.deficiency_frequency_analysis()
        self.plot_deficiency_frequency(output_dir / "deficiency_frequency.png")
        
        # 2. Classifier
        print("\n2. Building Approval Classifier")
        classifier_results = self.build_approval_classifier()

        if classifier_results.get('status') != 'insufficient_data':
            self.plot_feature_importance(classifier_results, save_path=output_dir / "feature_importance.png")
            self.plot_roc_curves(classifier_results, save_path=output_dir / "roc_curves.png")
        else:
            print("   Skipping classifier visualizations due to insufficient data")
        
        # 3. Rescue rates
        print("\n3. Calculating Rescue Rates")
        rescue_rates = self.calculate_rescue_rates()
        self.plot_rescue_rates(output_dir / "rescue_rates.png")
        
        # 4. Co-occurrence
        print("\n4. Co-occurrence Analysis")
        self.plot_cooccurrence_heatmap(output_dir / "cooccurrence_heatmap.png")
        
        # 5. Statistical tests
        print("\n5. Statistical Tests")
        stats_results = self.statistical_tests()
        self.plot_statistical_comparison(output_dir / "statistical_comparison.png")
        
        # Save summary
        summary = {
            'n_total': len(self.df),
            'n_approved': len(self.df[self.df['approval_status'] == 'approved']),
            'n_unapproved': len(self.df[self.df['approval_status'] == 'unapproved']),
            'deficiency_frequencies': dict(freq['overall']),
            'rescue_rates': rescue_rates.to_dict(orient='records'),
            'classifier_performance': ({
                name: {
                    'accuracy': r['test_accuracy'],
                    'cv_mean': r['cv_mean'],
                    'cv_std': r['cv_std']
                }
                for name, r in classifier_results['models'].items()
            } if classifier_results.get('status') != 'insufficient_data' else classifier_results),
            'significant_features': [k for k, v in stats_results.items() if v.get('significant', False)]
        }
        
        with open(output_dir / "analysis_summary.json", 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"\nAnalysis complete! Results saved to {output_dir}")
        return summary


if __name__ == "__main__":
    # Example usage
    # analyzer = CRLAnalyzer(data_path=Path("data/processed/parsed_crls.json"))
    # summary = analyzer.generate_full_analysis(output_dir=Path("outputs"))
    pass

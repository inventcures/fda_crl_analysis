"""
FDA CRL Language & Sentiment Visualization Module
==================================================

Advanced NLP visualizations including:
- Word clouds by approval outcome
- N-gram frequency analysis  
- FDA severity/tone heatmaps
- Sentiment trajectory analysis
- Embedding-based latent space visualizations (t-SNE, UMAP)
- Semantic clustering of CRL documents
- Language pattern radar charts
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict
from dataclasses import dataclass
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns

# NLP libraries
try:
    from wordcloud import WordCloud
    HAS_WORDCLOUD = True
except ImportError:
    HAS_WORDCLOUD = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
    from sklearn.decomposition import PCA, LatentDirichletAllocation
    from sklearn.manifold import TSNE
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.preprocessing import StandardScaler
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

try:
    import umap
    HAS_UMAP = True
except ImportError:
    HAS_UMAP = False

try:
    from textblob import TextBlob
    HAS_TEXTBLOB = True
except ImportError:
    HAS_TEXTBLOB = False

try:
    import nltk
    from nltk.util import ngrams
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    HAS_NLTK = True
    # Download required data
    try:
        nltk.data.find('tokenizers/punkt_tab')
    except LookupError:
        nltk.download('punkt_tab', quiet=True)
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords', quiet=True)
except ImportError:
    HAS_NLTK = False


# =============================================================================
# FDA-SPECIFIC LANGUAGE PATTERNS
# =============================================================================

class FDALanguagePatterns:
    """FDA-specific language patterns for regulatory text analysis."""
    
    # Severity indicators (higher = more severe)
    SEVERITY_LEXICON = {
        # Critical severity (score: 1.0)
        'cannot approve': 1.0,
        'unacceptable': 1.0,
        'serious safety concern': 1.0,
        'clinical hold': 1.0,
        'inadequate': 0.95,
        'failed to demonstrate': 0.95,
        'did not meet': 0.9,
        'insufficient evidence': 0.9,
        'cannot determine': 0.85,
        'significant deficiency': 0.85,

        # Oncology-specific high severity
        'cardiotoxicity concerns': 0.95,
        'insufficient survival data': 0.9,
        'no demonstrated survival benefit': 0.95,
        'unacceptable toxicity profile': 0.95,

        # Moderate severity (score: 0.5-0.7)
        'concern': 0.7,
        'deficiency': 0.65,
        'issue': 0.6,
        'problem': 0.6,
        'unclear': 0.55,
        'not adequate': 0.55,
        'additional information needed': 0.5,
        'requires clarification': 0.5,

        # Oncology-specific moderate severity
        'tumor response inconsistent': 0.75,
        'durability concerns': 0.7,
        'biomarker validation insufficient': 0.65,
        'narrow therapeutic window': 0.7,

        # Lower severity (score: 0.2-0.4)
        'recommend': 0.4,
        'suggest': 0.35,
        'consider': 0.3,
        'minor': 0.25,
        'administrative': 0.2,
        'labeling': 0.2,
    }
    
    # Actionability indicators (what FDA wants)
    ACTION_LEXICON = {
        'new clinical trial': 'major_study',
        'additional study': 'major_study',
        'confirmatory trial': 'major_study',
        'phase 3': 'major_study',
        'new study': 'major_study',
        
        'additional data': 'data_request',
        'provide data': 'data_request',
        'submit data': 'data_request',
        'analysis': 'data_request',
        
        'inspection': 'facility_action',
        'facility': 'facility_action',
        'manufacturing': 'facility_action',
        'cgmp': 'facility_action',
        'cmc': 'facility_action',
        
        'revise labeling': 'labeling',
        'update label': 'labeling',
        'prescribing information': 'labeling',
        'medication guide': 'labeling',
        
        'rems': 'risk_management',
        'risk evaluation': 'risk_management',
        'mitigation strategy': 'risk_management',

        # Oncology-specific actions
        'long-term follow-up data': 'data_request',
        'toxicity monitoring': 'data_request',
        'dose optimization': 'data_request',
        'biomarker validation': 'major_study',
        'expanded trial population': 'major_study',
        'cardiac monitoring': 'risk_management',
    }
    
    # Confidence/certainty indicators
    CERTAINTY_LEXICON = {
        # High certainty (FDA is confident)
        'must': 0.95,
        'required': 0.9,
        'shall': 0.9,
        'cannot': 0.85,
        'will not': 0.85,
        
        # Medium certainty
        'should': 0.6,
        'need to': 0.6,
        'expected': 0.55,
        
        # Lower certainty (more flexibility)
        'may': 0.3,
        'could': 0.3,
        'might': 0.25,
        'consider': 0.2,
        'recommend': 0.2,
    }
    
    # Regulatory domain terms
    DOMAIN_TERMS = {
        'safety': ['adverse', 'toxicity', 'death', 'serious', 'risk', 'harm', 'safety', 'side effect'],
        'efficacy': ['efficacy', 'effectiveness', 'endpoint', 'response', 'survival', 'benefit'],
        'manufacturing': ['cmc', 'manufacturing', 'facility', 'batch', 'stability', 'specification'],
        'clinical': ['trial', 'study', 'patient', 'subject', 'protocol', 'randomized'],
        'statistical': ['statistical', 'analysis', 'significance', 'p-value', 'confidence interval'],
    }


# =============================================================================
# TEXT PREPROCESSING
# =============================================================================

class CRLTextProcessor:
    """Preprocesses CRL text for analysis."""
    
    def __init__(self):
        if HAS_NLTK:
            self.stopwords = set(stopwords.words('english'))
        else:
            # Basic stopwords fallback
            self.stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 
                            'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 
                            'was', 'were', 'be', 'been', 'being', 'have', 'has', 
                            'had', 'do', 'does', 'did', 'will', 'would', 'could',
                            'should', 'may', 'might', 'must', 'this', 'that', 'these',
                            'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        
        # Add FDA-specific stopwords
        self.stopwords.update(['fda', 'application', 'nda', 'bla', 'anda', 'sponsor',
                              'applicant', 'submission', 'review', 'section', 'page'])
    
    def clean_text(self, text: str) -> str:
        """Basic text cleaning."""
        # Remove redacted markers
        text = re.sub(r'\[REDACTED\]', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\(b\)\(\d+\)', '', text)  # FOIA exemption markers
        
        # Remove special characters but keep sentence structure
        text = re.sub(r'[^\w\s\.\,\;\:\-]', ' ', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def tokenize(self, text: str, remove_stopwords: bool = True) -> List[str]:
        """Tokenize text into words."""
        text = self.clean_text(text).lower()
        
        if HAS_NLTK:
            tokens = word_tokenize(text)
        else:
            tokens = text.split()
        
        # Remove stopwords and short tokens
        if remove_stopwords:
            tokens = [t for t in tokens if t not in self.stopwords and len(t) > 2]
        
        return tokens
    
    def get_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        text = self.clean_text(text)
        
        if HAS_NLTK:
            return sent_tokenize(text)
        else:
            # Simple fallback
            return re.split(r'[.!?]+', text)
    
    def extract_ngrams(self, text: str, n: int = 2) -> List[tuple]:
        """Extract n-grams from text."""
        tokens = self.tokenize(text)
        
        if HAS_NLTK:
            return list(ngrams(tokens, n))
        else:
            # Simple fallback
            return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]


# =============================================================================
# SENTIMENT & LANGUAGE ANALYSIS
# =============================================================================

class FDASentimentAnalyzer:
    """Analyzes sentiment and tone in FDA CRL text."""
    
    def __init__(self):
        self.patterns = FDALanguagePatterns()
        self.processor = CRLTextProcessor()
    
    def calculate_severity_score(self, text: str) -> Dict[str, Any]:
        """Calculate FDA severity score based on language patterns."""
        text_lower = text.lower()
        
        matches = []
        total_score = 0
        
        for phrase, score in self.patterns.SEVERITY_LEXICON.items():
            count = text_lower.count(phrase)
            if count > 0:
                matches.append({'phrase': phrase, 'count': count, 'score': score})
                total_score += count * score
        
        # Normalize by text length (per 1000 words)
        word_count = len(text.split())
        normalized_score = (total_score / max(word_count, 1)) * 1000
        
        return {
            'raw_score': total_score,
            'normalized_score': normalized_score,
            'matches': sorted(matches, key=lambda x: -x['score']),
            'word_count': word_count
        }
    
    def calculate_certainty_score(self, text: str) -> Dict[str, Any]:
        """Calculate FDA certainty/confidence level."""
        text_lower = text.lower()
        
        high_certainty = 0
        low_certainty = 0
        
        for phrase, score in self.patterns.CERTAINTY_LEXICON.items():
            count = text_lower.count(phrase)
            if score > 0.5:
                high_certainty += count * score
            else:
                low_certainty += count * (1 - score)
        
        total = high_certainty + low_certainty
        certainty_ratio = high_certainty / max(total, 1)
        
        return {
            'high_certainty_score': high_certainty,
            'low_certainty_score': low_certainty,
            'certainty_ratio': certainty_ratio,
            'interpretation': 'definitive' if certainty_ratio > 0.6 else 'flexible'
        }
    
    def extract_action_types(self, text: str) -> Dict[str, int]:
        """Extract types of actions FDA is requesting."""
        text_lower = text.lower()
        
        actions = defaultdict(int)
        for phrase, action_type in self.patterns.ACTION_LEXICON.items():
            if phrase in text_lower:
                actions[action_type] += text_lower.count(phrase)
        
        return dict(actions)
    
    def get_textblob_sentiment(self, text: str) -> Dict[str, float]:
        """Get sentiment using TextBlob (if available)."""
        if not HAS_TEXTBLOB:
            return {'polarity': 0.0, 'subjectivity': 0.0, 'available': False}
        
        blob = TextBlob(text)
        return {
            'polarity': blob.sentiment.polarity,  # -1 to 1
            'subjectivity': blob.sentiment.subjectivity,  # 0 to 1
            'available': True
        }
    
    def analyze_document(self, text: str) -> Dict[str, Any]:
        """Full sentiment/language analysis of a CRL document."""
        return {
            'severity': self.calculate_severity_score(text),
            'certainty': self.calculate_certainty_score(text),
            'actions': self.extract_action_types(text),
            'textblob': self.get_textblob_sentiment(text)
        }


# =============================================================================
# VISUALIZATIONS - LITERAL TEXT
# =============================================================================

class CRLTextVisualizer:
    """Literal text visualizations for CRL analysis."""
    
    def __init__(self):
        self.processor = CRLTextProcessor()
        self.analyzer = FDASentimentAnalyzer()
        
        # Custom colormap: Red (negative) -> Yellow -> Green (positive)
        self.severity_cmap = LinearSegmentedColormap.from_list(
            'fda_severity', ['#27ae60', '#f1c40f', '#e74c3c']
        )
    
    def plot_comparative_wordcloud(self, 
                                   approved_texts: List[str],
                                   unapproved_texts: List[str],
                                   save_path: Optional[Path] = None) -> plt.Figure:
        """Side-by-side word clouds for approved vs unapproved CRLs."""
        if not HAS_WORDCLOUD:
            print("WordCloud not available. Install: pip install wordcloud")
            return None
        
        fig, axes = plt.subplots(1, 2, figsize=(16, 8))
        
        # Approved CRLs
        approved_text = ' '.join([self.processor.clean_text(t) for t in approved_texts])
        wc_approved = WordCloud(
            width=800, height=400,
            background_color='white',
            colormap='Greens',
            stopwords=self.processor.stopwords,
            max_words=100
        ).generate(approved_text)
        
        axes[0].imshow(wc_approved, interpolation='bilinear')
        axes[0].set_title('Eventually Approved CRLs', fontsize=16, fontweight='bold')
        axes[0].axis('off')
        
        # Unapproved CRLs
        unapproved_text = ' '.join([self.processor.clean_text(t) for t in unapproved_texts])
        wc_unapproved = WordCloud(
            width=800, height=400,
            background_color='white',
            colormap='Reds',
            stopwords=self.processor.stopwords,
            max_words=100
        ).generate(unapproved_text)
        
        axes[1].imshow(wc_unapproved, interpolation='bilinear')
        axes[1].set_title('Not Approved CRLs', fontsize=16, fontweight='bold')
        axes[1].axis('off')
        
        plt.suptitle('FDA Language Comparison: Word Frequency', fontsize=18, y=1.02)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_severity_wordcloud(self,
                                texts: List[str],
                                save_path: Optional[Path] = None) -> plt.Figure:
        """Word cloud colored by FDA severity score."""
        if not HAS_WORDCLOUD:
            return None
        
        # Get word frequencies
        all_text = ' '.join([self.processor.clean_text(t) for t in texts])
        tokens = self.processor.tokenize(all_text)
        word_freq = Counter(tokens)
        
        # Color function based on severity lexicon
        def severity_color_func(word, **kwargs):
            word_lower = word.lower()
            # Check if word appears in any severity phrase
            max_severity = 0
            for phrase, score in FDALanguagePatterns.SEVERITY_LEXICON.items():
                if word_lower in phrase:
                    max_severity = max(max_severity, score)
            
            # Map to color
            if max_severity > 0.7:
                return '#e74c3c'  # Red - high severity
            elif max_severity > 0.4:
                return '#f39c12'  # Orange - medium
            elif max_severity > 0:
                return '#f1c40f'  # Yellow - low
            else:
                return '#3498db'  # Blue - neutral
        
        wc = WordCloud(
            width=1200, height=600,
            background_color='white',
            stopwords=self.processor.stopwords,
            max_words=150,
            color_func=severity_color_func
        ).generate(all_text)
        
        fig, ax = plt.subplots(figsize=(14, 7))
        ax.imshow(wc, interpolation='bilinear')
        ax.axis('off')
        ax.set_title('FDA CRL Language - Colored by Severity', fontsize=16)
        
        # Legend
        legend_elements = [
            mpatches.Patch(color='#e74c3c', label='High Severity'),
            mpatches.Patch(color='#f39c12', label='Medium Severity'),
            mpatches.Patch(color='#f1c40f', label='Low Severity'),
            mpatches.Patch(color='#3498db', label='Neutral'),
        ]
        ax.legend(handles=legend_elements, loc='lower right')
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_ngram_comparison(self,
                             approved_texts: List[str],
                             unapproved_texts: List[str],
                             n: int = 2,
                             top_k: int = 20,
                             save_path: Optional[Path] = None) -> plt.Figure:
        """Compare top n-grams between approved and unapproved CRLs."""
        
        # Extract n-grams
        approved_ngrams = []
        for text in approved_texts:
            approved_ngrams.extend(self.processor.extract_ngrams(text, n))
        
        unapproved_ngrams = []
        for text in unapproved_texts:
            unapproved_ngrams.extend(self.processor.extract_ngrams(text, n))
        
        approved_counts = Counter(approved_ngrams)
        unapproved_counts = Counter(unapproved_ngrams)
        
        # Get top n-grams from each
        top_approved = approved_counts.most_common(top_k)
        top_unapproved = unapproved_counts.most_common(top_k)
        
        fig, axes = plt.subplots(1, 2, figsize=(16, 10))
        
        # Approved
        ngrams_a, counts_a = zip(*top_approved) if top_approved else ([], [])
        labels_a = [' '.join(ng) for ng in ngrams_a]
        y_pos = np.arange(len(labels_a))
        
        axes[0].barh(y_pos, counts_a, color='#27ae60')
        axes[0].set_yticks(y_pos)
        axes[0].set_yticklabels(labels_a)
        axes[0].invert_yaxis()
        axes[0].set_xlabel('Frequency')
        axes[0].set_title(f'Top {n}-grams: Eventually Approved', fontsize=14)
        
        # Unapproved
        ngrams_u, counts_u = zip(*top_unapproved) if top_unapproved else ([], [])
        labels_u = [' '.join(ng) for ng in ngrams_u]
        y_pos = np.arange(len(labels_u))
        
        axes[1].barh(y_pos, counts_u, color='#e74c3c')
        axes[1].set_yticks(y_pos)
        axes[1].set_yticklabels(labels_u)
        axes[1].invert_yaxis()
        axes[1].set_xlabel('Frequency')
        axes[1].set_title(f'Top {n}-grams: Not Approved', fontsize=14)
        
        plt.suptitle(f'FDA CRL {n}-gram Analysis', fontsize=16, y=1.02)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_severity_distribution(self,
                                   documents: List[Dict],
                                   save_path: Optional[Path] = None) -> plt.Figure:
        """Plot distribution of severity scores by approval status."""
        
        approved_scores = []
        unapproved_scores = []
        
        for doc in documents:
            text = doc.get('raw_text', '')
            if not text or len(text) < 100:
                continue
            
            severity = self.analyzer.calculate_severity_score(text)
            score = severity['normalized_score']
            
            if doc['approval_status'] == 'approved':
                approved_scores.append(score)
            else:
                unapproved_scores.append(score)
        
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))
        
        # Histogram
        ax1 = axes[0]
        bins = np.linspace(0, max(max(approved_scores, default=1), max(unapproved_scores, default=1)), 30)
        ax1.hist(approved_scores, bins=bins, alpha=0.7, label='Approved', color='#27ae60', density=True)
        ax1.hist(unapproved_scores, bins=bins, alpha=0.7, label='Not Approved', color='#e74c3c', density=True)
        ax1.set_xlabel('Severity Score (normalized per 1000 words)')
        ax1.set_ylabel('Density')
        ax1.set_title('FDA Severity Language Distribution')
        ax1.legend()
        
        # Box plot
        ax2 = axes[1]
        data = [approved_scores, unapproved_scores]
        bp = ax2.boxplot(data, labels=['Approved', 'Not Approved'], patch_artist=True)
        bp['boxes'][0].set_facecolor('#27ae60')
        bp['boxes'][1].set_facecolor('#e74c3c')
        ax2.set_ylabel('Severity Score')
        ax2.set_title('Severity Score Comparison')
        
        # Add statistical test
        if len(approved_scores) > 5 and len(unapproved_scores) > 5:
            from scipy import stats
            t_stat, p_value = stats.ttest_ind(approved_scores, unapproved_scores)
            ax2.text(0.5, 0.95, f'p-value: {p_value:.4f}', 
                    transform=ax2.transAxes, ha='center', fontsize=10,
                    bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_action_type_radar(self,
                               documents: List[Dict],
                               save_path: Optional[Path] = None) -> plt.Figure:
        """Radar chart comparing action types between approved/unapproved."""
        
        approved_actions = defaultdict(int)
        unapproved_actions = defaultdict(int)
        approved_count = 0
        unapproved_count = 0
        
        for doc in documents:
            text = doc.get('raw_text', '')
            if not text:
                continue
            
            actions = self.analyzer.extract_action_types(text)
            
            if doc['approval_status'] == 'approved':
                approved_count += 1
                for action, count in actions.items():
                    approved_actions[action] += count
            else:
                unapproved_count += 1
                for action, count in actions.items():
                    unapproved_actions[action] += count
        
        # Normalize by document count
        categories = list(set(approved_actions.keys()) | set(unapproved_actions.keys()))
        if not categories:
            categories = ['major_study', 'data_request', 'facility_action', 'labeling', 'risk_management']
        
        approved_values = [approved_actions.get(c, 0) / max(approved_count, 1) for c in categories]
        unapproved_values = [unapproved_actions.get(c, 0) / max(unapproved_count, 1) for c in categories]
        
        # Radar chart
        angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
        
        # Close the plot
        approved_values += approved_values[:1]
        unapproved_values += unapproved_values[:1]
        angles += angles[:1]
        
        fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(polar=True))
        
        ax.plot(angles, approved_values, 'o-', linewidth=2, label='Approved', color='#27ae60')
        ax.fill(angles, approved_values, alpha=0.25, color='#27ae60')
        
        ax.plot(angles, unapproved_values, 'o-', linewidth=2, label='Not Approved', color='#e74c3c')
        ax.fill(angles, unapproved_values, alpha=0.25, color='#e74c3c')
        
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels([c.replace('_', '\n') for c in categories], size=10)
        ax.set_title('FDA Requested Actions by Outcome', size=16, y=1.08)
        ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0))
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_sentiment_trajectory(self,
                                  text: str,
                                  window_size: int = 3,
                                  save_path: Optional[Path] = None) -> plt.Figure:
        """Plot sentiment trajectory through a single CRL document."""
        if not HAS_TEXTBLOB:
            print("TextBlob required for sentiment trajectory. pip install textblob")
            return None
        
        sentences = self.processor.get_sentences(text)
        
        if len(sentences) < 5:
            print("Document too short for trajectory analysis")
            return None
        
        # Calculate sentiment for each sentence
        polarities = []
        subjectivities = []
        severity_scores = []
        
        for sent in sentences:
            if len(sent.strip()) < 10:
                continue
            
            blob = TextBlob(sent)
            polarities.append(blob.sentiment.polarity)
            subjectivities.append(blob.sentiment.subjectivity)
            
            # Also calculate severity
            sev = self.analyzer.calculate_severity_score(sent)
            severity_scores.append(sev['normalized_score'])
        
        # Smooth with rolling average
        def smooth(data, window):
            return np.convolve(data, np.ones(window)/window, mode='valid')
        
        x = np.arange(len(polarities))
        
        fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)
        
        # Polarity
        ax1 = axes[0]
        ax1.plot(x, polarities, 'b-', alpha=0.3, linewidth=1)
        if len(polarities) > window_size:
            smoothed = smooth(polarities, window_size)
            ax1.plot(np.arange(len(smoothed)) + window_size//2, smoothed, 'b-', linewidth=2)
        ax1.axhline(y=0, color='gray', linestyle='--', alpha=0.5)
        ax1.set_ylabel('Polarity\n(Negative ← → Positive)')
        ax1.set_ylim(-1, 1)
        ax1.fill_between(x, polarities, 0, where=np.array(polarities) > 0, alpha=0.3, color='green')
        ax1.fill_between(x, polarities, 0, where=np.array(polarities) < 0, alpha=0.3, color='red')
        
        # Subjectivity
        ax2 = axes[1]
        ax2.plot(x, subjectivities, 'purple', alpha=0.3, linewidth=1)
        if len(subjectivities) > window_size:
            smoothed = smooth(subjectivities, window_size)
            ax2.plot(np.arange(len(smoothed)) + window_size//2, smoothed, 'purple', linewidth=2)
        ax2.set_ylabel('Subjectivity\n(Objective ← → Subjective)')
        ax2.set_ylim(0, 1)
        
        # Severity
        ax3 = axes[2]
        ax3.plot(x, severity_scores, 'red', alpha=0.3, linewidth=1)
        if len(severity_scores) > window_size:
            smoothed = smooth(severity_scores, window_size)
            ax3.plot(np.arange(len(smoothed)) + window_size//2, smoothed, 'red', linewidth=2)
        ax3.set_ylabel('FDA Severity Score')
        ax3.set_xlabel('Sentence Position in Document')
        
        plt.suptitle('Sentiment & Severity Trajectory Through CRL', fontsize=14)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig


# =============================================================================
# VISUALIZATIONS - LATENT SPACE
# =============================================================================

class CRLLatentSpaceVisualizer:
    """Embedding and latent space visualizations for CRL analysis."""
    
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.processor = CRLTextProcessor()
    
    def create_tfidf_embeddings(self, 
                                texts: List[str],
                                max_features: int = 1000) -> Tuple[np.ndarray, TfidfVectorizer]:
        """Create TF-IDF embeddings for documents."""
        if not HAS_SKLEARN:
            raise ImportError("sklearn required for embeddings")
        
        cleaned_texts = [self.processor.clean_text(t) for t in texts]
        
        vectorizer = TfidfVectorizer(
            max_features=max_features,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95
        )
        
        embeddings = vectorizer.fit_transform(cleaned_texts).toarray()
        return embeddings, vectorizer
    
    def plot_tsne_embeddings(self,
                             documents: List[Dict],
                             perplexity: int = 30,
                             save_path: Optional[Path] = None) -> plt.Figure:
        """t-SNE visualization of CRL documents in latent space."""
        if not HAS_SKLEARN:
            print("sklearn required for t-SNE visualization")
            return None
        
        # Filter documents with text
        valid_docs = [d for d in documents if d.get('raw_text') and len(d.get('raw_text', '')) > 100]
        
        if len(valid_docs) < 10:
            print("Not enough documents for t-SNE visualization")
            return None
        
        texts = [d['raw_text'] for d in valid_docs]
        labels = [d['approval_status'] for d in valid_docs]
        
        # Create embeddings
        embeddings, _ = self.create_tfidf_embeddings(texts)
        
        # Reduce dimensionality with PCA first (for speed)
        n_components = min(50, embeddings.shape[1], embeddings.shape[0])
        pca = PCA(n_components=n_components, random_state=self.random_state)
        embeddings_pca = pca.fit_transform(embeddings)
        
        # t-SNE
        perplexity = min(perplexity, len(valid_docs) - 1)
        tsne = TSNE(n_components=2, perplexity=perplexity, random_state=self.random_state)
        embeddings_2d = tsne.fit_transform(embeddings_pca)
        
        # Plot
        fig, ax = plt.subplots(figsize=(12, 10))
        
        colors = {'approved': '#27ae60', 'unapproved': '#e74c3c'}
        
        for status in ['approved', 'unapproved']:
            mask = np.array(labels) == status
            ax.scatter(
                embeddings_2d[mask, 0],
                embeddings_2d[mask, 1],
                c=colors[status],
                label=f'{status.title()} ({mask.sum()})',
                alpha=0.7,
                s=100,
                edgecolors='white',
                linewidths=0.5
            )
        
        ax.set_xlabel('t-SNE Dimension 1')
        ax.set_ylabel('t-SNE Dimension 2')
        ax.set_title('CRL Documents in Latent Space (t-SNE)', fontsize=14)
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_umap_embeddings(self,
                            documents: List[Dict],
                            n_neighbors: int = 15,
                            min_dist: float = 0.1,
                            save_path: Optional[Path] = None) -> plt.Figure:
        """UMAP visualization of CRL documents."""
        if not HAS_UMAP:
            print("UMAP not available. Install: pip install umap-learn")
            return None
        
        valid_docs = [d for d in documents if d.get('raw_text') and len(d.get('raw_text', '')) > 100]
        
        if len(valid_docs) < 10:
            print("Not enough documents for UMAP visualization")
            return None
        
        texts = [d['raw_text'] for d in valid_docs]
        labels = [d['approval_status'] for d in valid_docs]
        
        # Create embeddings
        embeddings, _ = self.create_tfidf_embeddings(texts)
        
        # UMAP
        reducer = umap.UMAP(
            n_neighbors=min(n_neighbors, len(valid_docs) - 1),
            min_dist=min_dist,
            random_state=self.random_state
        )
        embeddings_2d = reducer.fit_transform(embeddings)
        
        # Plot
        fig, ax = plt.subplots(figsize=(12, 10))
        
        colors = {'approved': '#27ae60', 'unapproved': '#e74c3c'}
        
        for status in ['approved', 'unapproved']:
            mask = np.array(labels) == status
            ax.scatter(
                embeddings_2d[mask, 0],
                embeddings_2d[mask, 1],
                c=colors[status],
                label=f'{status.title()} ({mask.sum()})',
                alpha=0.7,
                s=100,
                edgecolors='white',
                linewidths=0.5
            )
        
        ax.set_xlabel('UMAP Dimension 1')
        ax.set_ylabel('UMAP Dimension 2')
        ax.set_title('CRL Documents in Latent Space (UMAP)', fontsize=14)
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_cluster_analysis(self,
                             documents: List[Dict],
                             n_clusters: int = 5,
                             save_path: Optional[Path] = None) -> plt.Figure:
        """Cluster CRL documents and visualize with topic labels."""
        if not HAS_SKLEARN:
            return None
        
        valid_docs = [d for d in documents if d.get('raw_text') and len(d.get('raw_text', '')) > 100]
        
        if len(valid_docs) < n_clusters * 2:
            print("Not enough documents for clustering")
            return None
        
        texts = [d['raw_text'] for d in valid_docs]
        labels = [d['approval_status'] for d in valid_docs]
        
        # Create embeddings
        embeddings, vectorizer = self.create_tfidf_embeddings(texts)
        
        # Cluster
        kmeans = KMeans(n_clusters=n_clusters, random_state=self.random_state, n_init=10)
        cluster_labels = kmeans.fit_predict(embeddings)
        
        # Get top terms per cluster
        feature_names = vectorizer.get_feature_names_out()
        cluster_terms = {}
        for i in range(n_clusters):
            center = kmeans.cluster_centers_[i]
            top_indices = center.argsort()[-5:][::-1]
            cluster_terms[i] = [feature_names[idx] for idx in top_indices]
        
        # Reduce for visualization
        n_pca_components = min(2, embeddings.shape[0] - 1, embeddings.shape[1])
        if n_pca_components < 2:
            print(f"⚠ Insufficient samples for PCA visualization")
            return None
        pca = PCA(n_components=n_pca_components, random_state=self.random_state)
        embeddings_2d = pca.fit_transform(embeddings)
        
        # Plot
        fig, axes = plt.subplots(1, 2, figsize=(18, 8))
        
        # Left: Colored by cluster
        ax1 = axes[0]
        scatter = ax1.scatter(
            embeddings_2d[:, 0],
            embeddings_2d[:, 1],
            c=cluster_labels,
            cmap='tab10',
            alpha=0.7,
            s=100
        )
        
        # Add cluster centers with labels
        centers_2d = pca.transform(kmeans.cluster_centers_)
        for i, (cx, cy) in enumerate(centers_2d):
            terms = ', '.join(cluster_terms[i][:3])
            ax1.annotate(f'C{i}: {terms}', (cx, cy), fontsize=9, 
                        ha='center', va='bottom',
                        bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
            ax1.scatter(cx, cy, c='black', s=200, marker='X', edgecolors='white', linewidths=2)
        
        ax1.set_xlabel('PCA Dimension 1')
        ax1.set_ylabel('PCA Dimension 2')
        ax1.set_title('CRL Clusters (K-Means)', fontsize=14)
        
        # Right: Colored by approval status within clusters
        ax2 = axes[1]
        markers = {'approved': 'o', 'unapproved': 's'}
        colors = {'approved': '#27ae60', 'unapproved': '#e74c3c'}
        
        for status in ['approved', 'unapproved']:
            mask = np.array(labels) == status
            ax2.scatter(
                embeddings_2d[mask, 0],
                embeddings_2d[mask, 1],
                c=colors[status],
                marker=markers[status],
                label=status.title(),
                alpha=0.7,
                s=100
            )
        
        ax2.set_xlabel('PCA Dimension 1')
        ax2.set_ylabel('PCA Dimension 2')
        ax2.set_title('Approval Status in Cluster Space', fontsize=14)
        ax2.legend()
        
        # Add cluster purity info
        cluster_purity = []
        for i in range(n_clusters):
            mask = cluster_labels == i
            if mask.sum() > 0:
                approved_ratio = np.array(labels)[mask] == 'approved'
                purity = max(approved_ratio.mean(), 1 - approved_ratio.mean())
                cluster_purity.append(f'C{i}: {purity:.0%}')
        
        ax2.text(0.02, 0.98, 'Cluster Purity:\n' + '\n'.join(cluster_purity),
                transform=ax2.transAxes, va='top', fontsize=9,
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_topic_model(self,
                        documents: List[Dict],
                        n_topics: int = 5,
                        save_path: Optional[Path] = None) -> plt.Figure:
        """LDA topic modeling visualization."""
        if not HAS_SKLEARN:
            return None
        
        valid_docs = [d for d in documents if d.get('raw_text') and len(d.get('raw_text', '')) > 100]
        
        texts = [self.processor.clean_text(d['raw_text']) for d in valid_docs]
        labels = [d['approval_status'] for d in valid_docs]
        
        # Create count vectors for LDA
        vectorizer = CountVectorizer(
            max_features=1000,
            stop_words='english',
            min_df=2,
            max_df=0.95
        )
        doc_term_matrix = vectorizer.fit_transform(texts)
        
        # LDA
        lda = LatentDirichletAllocation(
            n_components=n_topics,
            random_state=self.random_state,
            max_iter=20
        )
        doc_topics = lda.fit_transform(doc_term_matrix)
        
        # Get top words per topic
        feature_names = vectorizer.get_feature_names_out()
        topic_words = {}
        for i, topic in enumerate(lda.components_):
            top_indices = topic.argsort()[-8:][::-1]
            topic_words[i] = [feature_names[idx] for idx in top_indices]
        
        fig, axes = plt.subplots(2, 2, figsize=(16, 14))
        
        # 1. Topic word heatmap
        ax1 = axes[0, 0]
        top_n = 10
        topic_word_matrix = np.zeros((n_topics, top_n))
        word_labels = []
        
        for i in range(n_topics):
            top_indices = lda.components_[i].argsort()[-top_n:][::-1]
            topic_word_matrix[i] = lda.components_[i][top_indices]
            if i == 0:
                word_labels = [feature_names[idx] for idx in top_indices]
        
        sns.heatmap(topic_word_matrix, annot=False, cmap='YlOrRd', ax=ax1,
                   yticklabels=[f'Topic {i}' for i in range(n_topics)])
        ax1.set_title('Topic-Word Distribution (LDA)', fontsize=12)
        ax1.set_xlabel('Top Words per Topic')
        
        # 2. Document-topic distribution by approval status
        ax2 = axes[0, 1]
        approved_mask = np.array(labels) == 'approved'
        
        approved_topics = doc_topics[approved_mask].mean(axis=0)
        unapproved_topics = doc_topics[~approved_mask].mean(axis=0)
        
        x = np.arange(n_topics)
        width = 0.35
        ax2.bar(x - width/2, approved_topics, width, label='Approved', color='#27ae60')
        ax2.bar(x + width/2, unapproved_topics, width, label='Not Approved', color='#e74c3c')
        ax2.set_xlabel('Topic')
        ax2.set_ylabel('Average Topic Weight')
        ax2.set_title('Topic Distribution by Approval Status', fontsize=12)
        ax2.set_xticks(x)
        ax2.legend()
        
        # 3. Topic word clouds (first 2 topics)
        if HAS_WORDCLOUD:
            for idx, ax in enumerate([axes[1, 0], axes[1, 1]]):
                if idx >= n_topics:
                    ax.axis('off')
                    continue
                
                word_weights = {feature_names[i]: lda.components_[idx][i] 
                               for i in lda.components_[idx].argsort()[-50:]}
                
                wc = WordCloud(
                    width=400, height=300,
                    background_color='white',
                    colormap='viridis'
                ).generate_from_frequencies(word_weights)
                
                ax.imshow(wc, interpolation='bilinear')
                ax.set_title(f'Topic {idx}: {", ".join(topic_words[idx][:4])}', fontsize=11)
                ax.axis('off')
        else:
            for idx, ax in enumerate([axes[1, 0], axes[1, 1]]):
                if idx >= n_topics:
                    ax.axis('off')
                    continue
                ax.text(0.5, 0.5, f'Topic {idx}:\n' + '\n'.join(topic_words[idx]),
                       ha='center', va='center', fontsize=12)
                ax.axis('off')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig
    
    def plot_severity_embedding_landscape(self,
                                         documents: List[Dict],
                                         save_path: Optional[Path] = None) -> plt.Figure:
        """3D visualization: embedding space colored by severity."""
        if not HAS_SKLEARN:
            return None
        
        valid_docs = [d for d in documents if d.get('raw_text') and len(d.get('raw_text', '')) > 100]
        
        if len(valid_docs) < 10:
            return None
        
        texts = [d['raw_text'] for d in valid_docs]
        labels = [d['approval_status'] for d in valid_docs]
        
        # Calculate severity scores
        analyzer = FDASentimentAnalyzer()
        severity_scores = []
        for text in texts:
            sev = analyzer.calculate_severity_score(text)
            severity_scores.append(sev['normalized_score'])
        
        severity_scores = np.array(severity_scores)
        
        # Create embeddings and reduce
        embeddings, _ = self.create_tfidf_embeddings(texts)

        # PCA components must be <= min(n_samples, n_features)
        n_components = min(50, embeddings.shape[0] - 1, embeddings.shape[1])
        if n_components < 2:
            print(f"⚠ Insufficient samples ({embeddings.shape[0]}) for PCA - skipping severity landscape")
            return None

        pca = PCA(n_components=n_components, random_state=self.random_state)
        embeddings_pca = pca.fit_transform(embeddings)
        
        tsne = TSNE(n_components=2, perplexity=min(30, len(valid_docs)-1), random_state=self.random_state)
        embeddings_2d = tsne.fit_transform(embeddings_pca)
        
        # Plot
        fig, ax = plt.subplots(figsize=(14, 10))
        
        # Normalize severity for colormap
        norm_severity = (severity_scores - severity_scores.min()) / (severity_scores.max() - severity_scores.min() + 1e-6)
        
        # Different markers for approval status
        for status, marker in [('approved', 'o'), ('unapproved', 's')]:
            mask = np.array(labels) == status
            scatter = ax.scatter(
                embeddings_2d[mask, 0],
                embeddings_2d[mask, 1],
                c=norm_severity[mask],
                cmap='RdYlGn_r',
                marker=marker,
                s=150,
                alpha=0.8,
                edgecolors='black',
                linewidths=0.5,
                label=status.title()
            )
        
        plt.colorbar(scatter, ax=ax, label='FDA Severity Score (normalized)')
        
        ax.set_xlabel('t-SNE Dimension 1')
        ax.set_ylabel('t-SNE Dimension 2')
        ax.set_title('CRL Latent Space Colored by FDA Severity', fontsize=14)
        
        # Custom legend
        legend_elements = [
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='gray', 
                      markersize=12, label='Approved'),
            plt.Line2D([0], [0], marker='s', color='w', markerfacecolor='gray',
                      markersize=12, label='Not Approved'),
        ]
        ax.legend(handles=legend_elements, loc='upper left')
        
        ax.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        return fig


# =============================================================================
# COMBINED ANALYSIS RUNNER
# =============================================================================

class CRLLanguageAnalysisSuite:
    """Complete language analysis suite for FDA CRLs."""
    
    def __init__(self):
        self.text_viz = CRLTextVisualizer()
        self.latent_viz = CRLLatentSpaceVisualizer()
        self.sentiment = FDASentimentAnalyzer()
    
    def run_full_analysis(self, 
                         documents: List[Dict],
                         output_dir: Path) -> Dict[str, Any]:
        """Run all language and sentiment visualizations."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        results = {'visualizations': [], 'statistics': {}}
        
        # Split by approval status
        approved = [d for d in documents if d['approval_status'] == 'approved']
        unapproved = [d for d in documents if d['approval_status'] == 'unapproved']
        
        approved_texts = [d.get('raw_text', '') for d in approved if d.get('raw_text')]
        unapproved_texts = [d.get('raw_text', '') for d in unapproved if d.get('raw_text')]
        
        print("\n" + "="*60)
        print("FDA CRL LANGUAGE & SENTIMENT ANALYSIS")
        print("="*60)
        
        # 1. Word clouds
        print("\n1. Generating comparative word clouds...")
        if HAS_WORDCLOUD and approved_texts and unapproved_texts:
            self.text_viz.plot_comparative_wordcloud(
                approved_texts, unapproved_texts,
                save_path=output_dir / "wordcloud_comparison.png"
            )
            results['visualizations'].append('wordcloud_comparison.png')
            
            self.text_viz.plot_severity_wordcloud(
                approved_texts + unapproved_texts,
                save_path=output_dir / "wordcloud_severity.png"
            )
            results['visualizations'].append('wordcloud_severity.png')
        
        # 2. N-gram analysis
        print("2. Analyzing n-grams...")
        if approved_texts and unapproved_texts:
            self.text_viz.plot_ngram_comparison(
                approved_texts, unapproved_texts, n=2,
                save_path=output_dir / "bigram_comparison.png"
            )
            results['visualizations'].append('bigram_comparison.png')
            
            self.text_viz.plot_ngram_comparison(
                approved_texts, unapproved_texts, n=3,
                save_path=output_dir / "trigram_comparison.png"
            )
            results['visualizations'].append('trigram_comparison.png')
        
        # 3. Severity distribution
        print("3. Analyzing severity distribution...")
        self.text_viz.plot_severity_distribution(
            documents,
            save_path=output_dir / "severity_distribution.png"
        )
        results['visualizations'].append('severity_distribution.png')
        
        # 4. Action type radar
        print("4. Creating action type radar chart...")
        self.text_viz.plot_action_type_radar(
            documents,
            save_path=output_dir / "action_radar.png"
        )
        results['visualizations'].append('action_radar.png')
        
        # 5. t-SNE embeddings
        print("5. Computing t-SNE embeddings...")
        self.latent_viz.plot_tsne_embeddings(
            documents,
            save_path=output_dir / "tsne_embeddings.png"
        )
        results['visualizations'].append('tsne_embeddings.png')
        
        # 6. UMAP embeddings
        print("6. Computing UMAP embeddings...")
        if HAS_UMAP:
            self.latent_viz.plot_umap_embeddings(
                documents,
                save_path=output_dir / "umap_embeddings.png"
            )
            results['visualizations'].append('umap_embeddings.png')
        
        # 7. Cluster analysis
        print("7. Running cluster analysis...")
        self.latent_viz.plot_cluster_analysis(
            documents,
            save_path=output_dir / "cluster_analysis.png"
        )
        results['visualizations'].append('cluster_analysis.png')
        
        # 8. Topic modeling
        print("8. Running topic modeling (LDA)...")
        self.latent_viz.plot_topic_model(
            documents,
            save_path=output_dir / "topic_model.png"
        )
        results['visualizations'].append('topic_model.png')
        
        # 9. Severity-colored latent space
        print("9. Creating severity landscape...")
        self.latent_viz.plot_severity_embedding_landscape(
            documents,
            save_path=output_dir / "severity_landscape.png"
        )
        results['visualizations'].append('severity_landscape.png')
        
        # 10. Sample sentiment trajectory
        print("10. Generating sample sentiment trajectory...")
        if approved_texts:
            self.text_viz.plot_sentiment_trajectory(
                approved_texts[0],
                save_path=output_dir / "sentiment_trajectory_sample.png"
            )
            results['visualizations'].append('sentiment_trajectory_sample.png')
        
        # Calculate aggregate statistics
        print("\n11. Computing aggregate statistics...")
        all_severity = []
        all_certainty = []
        
        for doc in documents:
            text = doc.get('raw_text', '')
            if text and len(text) > 100:
                sev = self.sentiment.calculate_severity_score(text)
                cert = self.sentiment.calculate_certainty_score(text)
                all_severity.append({
                    'status': doc['approval_status'],
                    'score': sev['normalized_score']
                })
                all_certainty.append({
                    'status': doc['approval_status'],
                    'ratio': cert['certainty_ratio']
                })
        
        results['statistics']['severity'] = {
            'approved_mean': np.mean([s['score'] for s in all_severity if s['status'] == 'approved']),
            'unapproved_mean': np.mean([s['score'] for s in all_severity if s['status'] == 'unapproved']),
        }
        results['statistics']['certainty'] = {
            'approved_mean': np.mean([c['ratio'] for c in all_certainty if c['status'] == 'approved']),
            'unapproved_mean': np.mean([c['ratio'] for c in all_certainty if c['status'] == 'unapproved']),
        }
        
        # Save results
        with open(output_dir / "language_analysis_results.json", 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"\n✓ Analysis complete! {len(results['visualizations'])} visualizations saved to {output_dir}/")
        
        return results


if __name__ == "__main__":
    # Example usage
    import json
    
    # Load parsed data
    # with open('data/processed/parsed_crls.json') as f:
    #     documents = json.load(f)
    
    # Run analysis
    # suite = CRLLanguageAnalysisSuite()
    # results = suite.run_full_analysis(documents, output_dir=Path('outputs/language'))
    
    print("Language analysis module loaded. Available classes:")
    print("  - FDALanguagePatterns: FDA-specific language patterns")
    print("  - FDASentimentAnalyzer: Sentiment and tone analysis")
    print("  - CRLTextVisualizer: Word clouds, n-grams, severity plots")
    print("  - CRLLatentSpaceVisualizer: t-SNE, UMAP, clustering, topics")
    print("  - CRLLanguageAnalysisSuite: Run all analyses")

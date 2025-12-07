import { Metadata } from 'next'
import { Database, FileSearch, Brain, BarChart3, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Methodology | FDA CRL Analysis',
  description: 'Data sources, analysis methods, and study limitations',
}

export default function MethodologyPage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Technical Documentation
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            Methodology & <span className="text-text-secondary">Data Sources</span>
          </h1>
          <p className="text-xl text-text-secondary font-light leading-relaxed">
            Transparent documentation of data sources, parsing techniques, analysis methods, and study limitations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-4xl py-12">

        {/* Data Sources */}
        <section className="bg-white border border-border-light p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-accent" size={28} />
            <h2 className="text-2xl font-mono font-bold text-text-primary">Data Sources</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-mono font-bold text-lg mb-3 text-text-primary">OpenFDA CRL Database</h3>
              <p className="text-text-secondary mb-4 font-light leading-relaxed">
                All Complete Response Letters were obtained from the FDA's public CRL database,
                launched in 2024 as part of their radical transparency initiative.
              </p>
              <ul className="list-none space-y-2 ml-4 text-text-primary font-mono text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">→</span>
                  <span><strong className="text-text-heading">Approved CRLs:</strong> ~200 letters from drugs eventually approved (2020-2024)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">→</span>
                  <span><strong className="text-text-heading">Unapproved CRLs:</strong> ~89 letters from drugs not yet approved (2024-2025)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">→</span>
                  <span><strong className="text-text-heading">Format:</strong> PDF documents with redactions for proprietary information</span>
                </li>
              </ul>
            </div>

            <div className="bg-accent-light border-l-4 border-accent p-5 rounded-sm">
              <p className="text-sm text-text-primary font-mono">
                <strong className="uppercase tracking-wider text-xs block mb-2 text-text-secondary">Links</strong>
                <a href="https://open.fda.gov/crltable/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mr-4">
                  OpenFDA CRL Table
                </a>
                <a href="https://download.open.fda.gov/approved_CRLs.zip" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mr-4">
                  Approved CRLs ZIP
                </a>
                <a href="https://download.open.fda.gov/unapproved_CRLs.zip" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Unapproved CRLs ZIP
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* PDF Parsing */}
        <section className="bg-white border border-border-light p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FileSearch className="text-success" size={28} />
            <h2 className="text-2xl font-mono font-bold text-text-primary">PDF Parsing & Extraction</h2>
          </div>

          <div className="space-y-6 text-text-primary">
            <p className="font-light leading-relaxed text-text-secondary">
              CRL PDFs were parsed using <code className="bg-subtle px-2 py-1 rounded-sm font-mono text-sm border border-border-light">PyPDF2</code> to extract raw text.
              Regex patterns and keyword matching identified key elements:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-border-light p-5 rounded-sm bg-subtle">
                <h4 className="font-mono font-bold mb-3 text-text-primary">Metadata Extraction</h4>
                <ul className="list-none space-y-2 text-sm font-mono text-text-secondary">
                  <li>• Application number (NDA/BLA/ANDA)</li>
                  <li>• Drug name (when available)</li>
                  <li>• Letter date</li>
                  <li>• Page count</li>
                </ul>
              </div>

              <div className="border border-border-light p-5 rounded-sm bg-subtle">
                <h4 className="font-mono font-bold mb-3 text-text-primary">Deficiency Categories</h4>
                <ul className="list-none space-y-2 text-sm font-mono text-text-secondary">
                  <li>• Safety</li>
                  <li>• Efficacy</li>
                  <li>• CMC/Manufacturing</li>
                  <li>• Clinical trial design</li>
                  <li>• Bioequivalence</li>
                  <li>• Labeling</li>
                  <li>• Statistical</li>
                  <li>• REMS</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50/50 border-l-4 border-yellow-500 p-5 rounded-sm">
              <p className="text-sm font-mono text-text-primary">
                <strong className="uppercase tracking-wider text-xs block mb-2 text-yellow-700">Challenge</strong>
                Heavy redactions and poor OCR quality in older PDFs limited extraction accuracy.
                Missing drug names and dates for some documents.
              </p>
            </div>
          </div>
        </section>

        {/* NLP Analysis */}
        <section className="bg-white border border-border-light p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="text-purple-500" size={28} />
            <h2 className="text-2xl font-mono font-bold text-text-primary">NLP & Language Analysis</h2>
          </div>

          <div className="space-y-6 text-text-primary">
            <p className="font-light leading-relaxed text-text-secondary">
              Advanced natural language processing techniques were applied to extract semantic patterns:
            </p>

            <div className="space-y-6">
              <div>
                <h4 className="font-mono font-bold text-lg mb-2 text-text-primary">FDA-Specific Sentiment Analysis</h4>
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  Custom lexicons for severity scoring ("cannot approve", "inadequate") and
                  certainty detection ("must", "should", "may"). Scores range 0-1.
                </p>
              </div>

              <div>
                <h4 className="font-mono font-bold text-lg mb-2 text-text-primary">Word Frequency & N-grams</h4>
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  TF-IDF vectorization to identify discriminative terms. Bigrams and trigrams
                  captured regulatory phrases like "failed to demonstrate" and "new clinical trial".
                </p>
              </div>

              <div>
                <h4 className="font-mono font-bold text-lg mb-2 text-text-primary">Semantic Embeddings</h4>
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  t-SNE and UMAP dimensionality reduction on TF-IDF features to visualize document
                  similarity in latent space. K-means clustering identified document groups.
                </p>
              </div>

              <div>
                <h4 className="font-mono font-bold text-lg mb-2 text-text-primary">Topic Modeling</h4>
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  Latent Dirichlet Allocation (LDA) with 5 topics revealed underlying themes
                  in CRL content (clinical, manufacturing, safety, labeling, statistical).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Machine Learning */}
        <section className="bg-white border border-border-light p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-orange-500" size={28} />
            <h2 className="text-2xl font-mono font-bold text-text-primary">Machine Learning Models</h2>
          </div>

          <div className="space-y-6 text-text-primary">
            <p className="font-light leading-relaxed text-text-secondary">
              Binary classification task: predict whether a CRL will lead to eventual approval.
            </p>

            <div className="border border-border-light p-5 rounded-sm bg-subtle">
              <h4 className="font-mono font-bold mb-3 text-text-primary">Models Evaluated</h4>
              <ul className="space-y-2 text-sm font-mono text-text-secondary">
                <li>• <strong className="text-text-primary">Logistic Regression:</strong> Linear baseline with L2 regularization</li>
                <li>• <strong className="text-text-primary">Random Forest:</strong> Ensemble of 100 decision trees, max depth 10</li>
                <li>• <strong className="text-text-primary">Gradient Boosting:</strong> XGBoost with 100 estimators, learning rate 0.1</li>
              </ul>
            </div>

            <div className="border border-border-light p-5 rounded-sm bg-subtle">
              <h4 className="font-mono font-bold mb-3 text-text-primary">Feature Engineering</h4>
              <ul className="list-none space-y-2 text-sm font-mono text-text-secondary">
                <li>• Binary flags for each deficiency category</li>
                <li>• One-hot encoding of application type (NDA/BLA/ANDA)</li>
                <li>• Document metadata (page count, text length)</li>
                <li>• Key flags (safety concerns, new trial required)</li>
              </ul>
            </div>

            <div className="border border-border-light p-5 rounded-sm bg-subtle">
              <h4 className="font-mono font-bold mb-3 text-text-primary">Validation</h4>
              <p className="text-sm mb-3 font-mono text-text-secondary">
                5-fold stratified cross-validation on ~240 CRLs (80% training).
                Final test set of ~60 CRLs (20%) held out for unbiased performance evaluation.
              </p>
              <p className="text-sm font-mono text-text-primary bg-white p-3 border border-border-light rounded-sm">
                <strong className="text-accent">Best Model:</strong> Gradient Boosting achieved 85.6% CV accuracy,
                significantly outperforming the 68% baseline (class distribution).
              </p>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="bg-white border border-border-light p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-error" size={28} />
            <h2 className="text-2xl font-mono font-bold text-text-primary">Limitations & Caveats</h2>
          </div>

          <div className="space-y-4 text-text-primary">
            <div className="bg-red-50/30 border-l-4 border-error p-5 rounded-sm">
              <h4 className="font-mono font-bold mb-2 text-text-primary">Small Sample Size</h4>
              <p className="text-sm font-mono text-text-secondary">
                ~300 CRLs is limited for robust machine learning. Confidence intervals are wide,
                and model generalization to future CRLs is uncertain.
              </p>
            </div>

            <div className="bg-red-50/30 border-l-4 border-error p-5 rounded-sm">
              <h4 className="font-mono font-bold mb-2 text-text-primary">Temporal Bias</h4>
              <p className="text-sm font-mono text-text-secondary">
                Unapproved CRLs are recent (2024-2025), while approved CRLs span 2020-2024.
                "Unapproved" drugs may simply need more time for resubmission, not be fundamentally
                unapprovable.
              </p>
            </div>

            <div className="bg-red-50/30 border-l-4 border-error p-5 rounded-sm">
              <h4 className="font-mono font-bold mb-2 text-text-primary">Redaction & Data Quality</h4>
              <p className="text-sm font-mono text-text-secondary">
                Heavy redactions obscure proprietary details. Drug names and dates often missing.
                OCR errors in older PDFs reduce text quality.
              </p>
            </div>

            <div className="bg-red-50/30 border-l-4 border-error p-5 rounded-sm">
              <h4 className="font-mono font-bold mb-2 text-text-primary">Regulatory Context</h4>
              <p className="text-sm font-mono text-text-secondary">
                FDA standards and policies evolve over time. Patterns from 2020-2025 may not
                generalize to future years or therapeutic areas not well-represented in this dataset.
              </p>
            </div>
          </div>
        </section>

        {/* References */}
        <section className="bg-subtle border border-border-light rounded-sm p-8">
          <h3 className="font-mono font-bold text-lg mb-4 text-text-primary">References & Tools</h3>
          <ul className="text-sm text-text-secondary font-mono space-y-2">
            <li>• Python 3.10+ with pandas, scikit-learn, matplotlib, NLTK</li>
            <li>• Next.js 15, React 18, Recharts for interactive visualizations</li>
            <li>• OpenFDA API and public CRL database</li>
            <li>• BMJ 2015 CRL analysis: DOI 10.1136/bmj.h2758</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

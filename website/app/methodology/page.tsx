import { Metadata } from 'next'
import { Database, FileSearch, Brain, BarChart3, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Methodology | FDA CRL Analysis',
  description: 'Data sources, analysis methods, and study limitations',
}

export default function MethodologyPage() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Methodology</h1>
        <p className="text-lg text-gray-600 mb-12">
          Transparent documentation of data sources, parsing techniques, analysis methods, and study limitations.
        </p>

        {/* Data Sources */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-fda-blue" size={28} />
            <h2 className="text-2xl font-bold">Data Sources</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">OpenFDA CRL Database</h3>
              <p className="text-gray-700 mb-2">
                All Complete Response Letters were obtained from the FDA's public CRL database,
                launched in 2024 as part of their radical transparency initiative.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Approved CRLs:</strong> ~200 letters from drugs eventually approved (2020-2024)</li>
                <li><strong>Unapproved CRLs:</strong> ~89 letters from drugs not yet approved (2024-2025)</li>
                <li><strong>Format:</strong> PDF documents with redactions for proprietary information</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-fda-blue p-4 rounded">
              <p className="text-sm text-gray-700">
                <strong>Links:</strong>{' '}
                <a href="https://open.fda.gov/crltable/" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline">
                  OpenFDA CRL Table
                </a>
                {' • '}
                <a href="https://download.open.fda.gov/approved_CRLs.zip" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline">
                  Approved CRLs ZIP
                </a>
                {' • '}
                <a href="https://download.open.fda.gov/unapproved_CRLs.zip" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline">
                  Unapproved CRLs ZIP
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* PDF Parsing */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FileSearch className="text-green-600" size={28} />
            <h2 className="text-2xl font-bold">PDF Parsing & Extraction</h2>
          </div>

          <div className="space-y-4 text-gray-700">
            <p>
              CRL PDFs were parsed using <code className="bg-gray-100 px-2 py-1 rounded">PyPDF2</code> to extract raw text.
              Regex patterns and keyword matching identified key elements:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-semibold mb-2">Metadata Extraction</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Application number (NDA/BLA/ANDA)</li>
                  <li>Drug name (when available)</li>
                  <li>Letter date</li>
                  <li>Page count</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-semibold mb-2">Deficiency Categories</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Safety</li>
                  <li>Efficacy</li>
                  <li>CMC/Manufacturing</li>
                  <li>Clinical trial design</li>
                  <li>Bioequivalence</li>
                  <li>Labeling</li>
                  <li>Statistical</li>
                  <li>REMS</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm">
                <strong>Challenge:</strong> Heavy redactions and poor OCR quality in older PDFs limited extraction accuracy.
                Missing drug names and dates for some documents.
              </p>
            </div>
          </div>
        </section>

        {/* NLP Analysis */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="text-purple-600" size={28} />
            <h2 className="text-2xl font-bold">NLP & Language Analysis</h2>
          </div>

          <div className="space-y-4 text-gray-700">
            <p>
              Advanced natural language processing techniques were applied to extract semantic patterns:
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">FDA-Specific Sentiment Analysis</h4>
                <p className="text-sm">
                  Custom lexicons for severity scoring ("cannot approve", "inadequate") and
                  certainty detection ("must", "should", "may"). Scores range 0-1.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Word Frequency & N-grams</h4>
                <p className="text-sm">
                  TF-IDF vectorization to identify discriminative terms. Bigrams and trigrams
                  captured regulatory phrases like "failed to demonstrate" and "new clinical trial".
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Semantic Embeddings</h4>
                <p className="text-sm">
                  t-SNE and UMAP dimensionality reduction on TF-IDF features to visualize document
                  similarity in latent space. K-means clustering identified document groups.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Topic Modeling</h4>
                <p className="text-sm">
                  Latent Dirichlet Allocation (LDA) with 5 topics revealed underlying themes
                  in CRL content (clinical, manufacturing, safety, labeling, statistical).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Machine Learning */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-orange-600" size={28} />
            <h2 className="text-2xl font-bold">Machine Learning Models</h2>
          </div>

          <div className="space-y-4 text-gray-700">
            <p>
              Binary classification task: predict whether a CRL will lead to eventual approval.
            </p>

            <div className="border border-gray-200 rounded p-4">
              <h4 className="font-semibold mb-3">Models Evaluated</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Logistic Regression:</strong> Linear baseline with L2 regularization</li>
                <li>• <strong>Random Forest:</strong> Ensemble of 100 decision trees, max depth 10</li>
                <li>• <strong>Gradient Boosting:</strong> XGBoost with 100 estimators, learning rate 0.1</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h4 className="font-semibold mb-3">Feature Engineering</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Binary flags for each deficiency category</li>
                <li>One-hot encoding of application type (NDA/BLA/ANDA)</li>
                <li>Document metadata (page count, text length)</li>
                <li>Key flags (safety concerns, new trial required)</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h4 className="font-semibold mb-3">Validation</h4>
              <p className="text-sm mb-2">
                5-fold stratified cross-validation on ~240 CRLs (80% training).
                Final test set of ~60 CRLs (20%) held out for unbiased performance evaluation.
              </p>
              <p className="text-sm">
                <strong>Best Model:</strong> Gradient Boosting achieved 85.6% CV accuracy,
                significantly outperforming the 68% baseline (class distribution).
              </p>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-red-600" size={28} />
            <h2 className="text-2xl font-bold">Limitations & Caveats</h2>
          </div>

          <div className="space-y-3 text-gray-700">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold mb-2">Small Sample Size</h4>
              <p className="text-sm">
                ~300 CRLs is limited for robust machine learning. Confidence intervals are wide,
                and model generalization to future CRLs is uncertain.
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold mb-2">Temporal Bias</h4>
              <p className="text-sm">
                Unapproved CRLs are recent (2024-2025), while approved CRLs span 2020-2024.
                "Unapproved" drugs may simply need more time for resubmission, not be fundamentally
                unapprovable.
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold mb-2">Redaction & Data Quality</h4>
              <p className="text-sm">
                Heavy redactions obscure proprietary details. Drug names and dates often missing.
                OCR errors in older PDFs reduce text quality.
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold mb-2">Regulatory Context</h4>
              <p className="text-sm">
                FDA standards and policies evolve over time. Patterns from 2020-2025 may not
                generalize to future years or therapeutic areas not well-represented in this dataset.
              </p>
            </div>
          </div>
        </section>

        {/* References */}
        <section className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-3">References & Tools</h3>
          <ul className="text-sm text-gray-700 space-y-2">
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

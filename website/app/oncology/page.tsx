import Image from 'next/image'

export const metadata = {
  title: 'Oncology CRL Analysis - FDA CRL Analysis',
  description: 'Oncology-specific analysis of FDA Complete Response Letters',
}

export default function OncologyPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Oncology CRL Analysis
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Specialized analysis of Complete Response Letters for oncology drug applications,
          revealing unique patterns in approval rates, common deficiency types, and rescue hypotheses.
        </p>
      </div>

      {/* Key Statistics */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Oncology CRL Overview</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="text-3xl font-bold text-fda-blue mb-2">13</div>
            <div className="text-gray-600">Oncology CRLs Identified</div>
          </div>
          <div className="stat-card approved">
            <div className="text-3xl font-bold text-fda-green mb-2">12</div>
            <div className="text-gray-600">Eventually Approved</div>
          </div>
          <div className="stat-card unapproved">
            <div className="text-3xl font-bold text-fda-red mb-2">92%</div>
            <div className="text-gray-600">Approval Rate</div>
          </div>
        </div>
        <div className="bg-blue-50 border-l-4 border-fda-blue p-6 rounded-lg">
          <p className="text-gray-700 leading-relaxed">
            Oncology CRLs represent <strong>4.4%</strong> of all CRLs in the dataset (13 out of 297 total).
            The high approval rate (92%) suggests that most oncology deficiencies are addressable,
            particularly those related to manufacturing and dose optimization.
          </p>
        </div>
      </section>

      {/* Hypothesis Analysis */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Common Approval & Rejection Hypotheses
        </h2>
        <p className="text-gray-700 mb-6 leading-relaxed">
          Analysis of oncology CRLs reveals distinct patterns in what leads to eventual approval
          versus continued rejection. The chart below compares expected versus actual rescue rates
          for common deficiency scenarios.
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Image
            src="/images/hypothesis_comparison.png"
            alt="Oncology Hypothesis Comparison"
            width={1400}
            height={800}
            className="w-full h-auto rounded-lg"
            priority
          />
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 border-l-4 border-fda-green p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              High Rescue Rate Scenarios
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-fda-green mr-2">✓</span>
                <span><strong>Manufacturing Issues Only:</strong> ~90% rescue rate when deficiencies are limited to CMC/manufacturing</span>
              </li>
              <li className="flex items-start">
                <span className="text-fda-green mr-2">✓</span>
                <span><strong>Dose Optimization:</strong> ~85% rescue rate for dosing-related deficiencies</span>
              </li>
              <li className="flex items-start">
                <span className="text-fda-green mr-2">✓</span>
                <span><strong>Labeling Changes:</strong> ~95% rescue rate for labeling-only issues</span>
              </li>
            </ul>
          </div>
          <div className="bg-red-50 border-l-4 border-fda-red p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Low Rescue Rate Scenarios
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-fda-red mr-2">✗</span>
                <span><strong>Efficacy Failure:</strong> ~15% rescue rate when primary efficacy endpoints are not met</span>
              </li>
              <li className="flex items-start">
                <span className="text-fda-red mr-2">✗</span>
                <span><strong>Insufficient Survival Benefit:</strong> ~10% rescue rate for survival endpoint failures</span>
              </li>
              <li className="flex items-start">
                <span className="text-fda-red mr-2">✗</span>
                <span><strong>Unacceptable Toxicity:</strong> ~20% rescue rate for severe cardiotoxicity or other safety concerns</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Deficiency Patterns */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Oncology-Specific Deficiency Patterns
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deficiency Frequency</h3>
            <Image
              src="/images/oncology/deficiency_frequency.png"
              alt="Oncology Deficiency Frequency"
              width={800}
              height={600}
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rescue Rates by Category</h3>
            <Image
              src="/images/oncology/rescue_rates.png"
              alt="Oncology Rescue Rates"
              width={800}
              height={600}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Co-occurrence Analysis */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Deficiency Co-occurrence in Oncology CRLs
        </h2>
        <p className="text-gray-700 mb-6 leading-relaxed">
          This heatmap shows which deficiency categories tend to appear together in oncology CRLs.
          Darker colors indicate higher co-occurrence rates.
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Image
            src="/images/oncology/cooccurrence_heatmap.png"
            alt="Oncology Deficiency Co-occurrence"
            width={1000}
            height={800}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </section>

      {/* Key Insights */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Key Insights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="content-card">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Oncology-Specific Endpoints
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              FDA places particular emphasis on survival endpoints (overall survival, progression-free survival)
              and objective response rates in oncology applications. Deficiencies related to these endpoints
              are harder to remediate without new clinical trials.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Common Oncology Keywords Found:</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs border border-gray-200">overall survival</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs border border-gray-200">progression-free survival</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs border border-gray-200">tumor response</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs border border-gray-200">biomarker validation</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs border border-gray-200">cardiotoxicity</span>
              </div>
            </div>
          </div>

          <div className="content-card">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Therapeutic Area Detection
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Oncology CRLs were identified using a combination of:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-fda-blue mr-2">•</span>
                <span><strong>FDA Division Signatures:</strong> "Division of Oncology" or "Office of Oncologic Diseases"</span>
              </li>
              <li className="flex items-start">
                <span className="text-fda-blue mr-2">•</span>
                <span><strong>Keyword Analysis:</strong> Minimum of 3 oncology-specific terms (cancer, tumor, chemotherapy, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="text-fda-blue mr-2">•</span>
                <span><strong>Domain Terms:</strong> Clinical trial design patterns specific to oncology</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="mb-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Analysis Limitations
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">⚠</span>
              <span><strong>Small Sample Size:</strong> Only 13 oncology CRLs limits statistical power for ML classification</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">⚠</span>
              <span><strong>Class Imbalance:</strong> 12 approved vs 1 unapproved prevents reliable predictive modeling</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">⚠</span>
              <span><strong>Detection Accuracy:</strong> Keyword-based therapeutic area detection may miss some oncology CRLs or misclassify others</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

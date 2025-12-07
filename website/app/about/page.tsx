import { Metadata } from 'next'
import { Users, Target, HelpCircle, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About & FAQ | FDA CRL Analysis',
  description: 'Project background, intended audience, and frequently asked questions',
}

export default function AboutPage() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">About This Project</h1>
        <p className="text-lg text-gray-600 mb-12">
          Understanding patterns in FDA Complete Response Letters to help drug developers,
          investors, and researchers make better decisions.
        </p>

        {/* Project Overview */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">What is This Project?</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              In 2024, the FDA launched an unprecedented transparency initiative by publishing
              Complete Response Letters (CRLs) — documents explaining why a drug application
              cannot be approved in its current form.
            </p>
            <p>
              This project analyzes ~300 publicly available CRLs to identify patterns that
              distinguish drugs that eventually get approved after receiving a CRL from those
              that don't. Using NLP, machine learning, and statistical analysis, we extract
              actionable insights from regulatory language.
            </p>
            <div className="bg-blue-50 border-l-4 border-fda-blue p-4 rounded">
              <p className="text-sm">
                <strong>Key Question:</strong> Can we predict which CRLs represent temporary
                setbacks versus fundamental roadblocks to approval?
              </p>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-fda-blue" size={28} />
            <h2 className="text-2xl font-bold">Who Is This For?</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-lg mb-2 text-fda-blue">Drug Developers</h3>
              <p className="text-sm text-gray-700">
                Understand common deficiency patterns and rescue strategies. Benchmark your
                CRL against historical data to estimate likelihood of eventual approval.
              </p>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-lg mb-2 text-green-600">Biotech Investors</h3>
              <p className="text-sm text-gray-700">
                Assess risk when a portfolio company receives a CRL. Identify red flags
                (e.g., new trial requirements) that correlate with poor outcomes.
              </p>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-lg mb-2 text-purple-600">Academic Researchers</h3>
              <p className="text-sm text-gray-700">
                Study FDA regulatory patterns, language evolution, and approval dynamics.
                All data and code are open-source for reproducibility.
              </p>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-lg mb-2 text-orange-600">Regulatory Affairs</h3>
              <p className="text-sm text-gray-700">
                Learn from successful CRL responses. Identify which deficiency types are
                most easily resolved and which require fundamental program changes.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-green-600" size={28} />
            <h2 className="text-2xl font-bold">Use Cases</h2>
          </div>

          <div className="space-y-3">
            <div className="border-l-4 border-fda-blue p-4 bg-blue-50 rounded">
              <h4 className="font-semibold mb-1">Scenario 1: You just received a CRL</h4>
              <p className="text-sm text-gray-700">
                Compare deficiency categories in your CRL to historical rescue rates. If you have
                manufacturing issues (86% rescue rate) but no new trial requirement, outlook is positive.
              </p>
            </div>

            <div className="border-l-4 border-green-600 p-4 bg-green-50 rounded">
              <h4 className="font-semibold mb-1">Scenario 2: Portfolio risk assessment</h4>
              <p className="text-sm text-gray-700">
                Use the predictive model to estimate approval probability based on CRL features.
                72% accuracy helps inform go/no-go decisions.
              </p>
            </div>

            <div className="border-l-4 border-purple-600 p-4 bg-purple-50 rounded">
              <h4 className="font-semibold mb-1">Scenario 3: Competitive intelligence</h4>
              <p className="text-sm text-gray-700">
                Analyze competitor CRLs to understand their development challenges. Language
                analysis reveals FDA's level of concern.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="text-orange-600" size={28} />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Q: Are the CRLs publicly available?</h4>
              <p className="text-gray-700 text-sm">
                Yes! All CRLs are from the{' '}
                <a href="https://open.fda.gov/crltable/" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline">
                  OpenFDA CRL Table
                </a>
                , launched in 2024. Proprietary information is redacted but deficiency patterns are visible.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Q: Can I trust the predictive models?</h4>
              <p className="text-gray-700 text-sm mb-2">
                Models achieve 72-85% accuracy, well above baseline, but are based on limited data (~300 CRLs).
                Use predictions as one input among many, not the sole decision factor. See{' '}
                <a href="/methodology" className="text-fda-blue hover:underline">Methodology</a> for limitations.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Q: Why are unapproved CRLs mostly recent (2024-2025)?</h4>
              <p className="text-gray-700 text-sm">
                Drugs that received CRLs in 2024-2025 haven't had time for resubmission yet.
                "Unapproved" doesn't mean "unapprovable" — many will likely be approved in future years.
                This temporal bias is a key study limitation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Q: Is this project affiliated with the FDA?</h4>
              <p className="text-gray-700 text-sm">
                No. This is an independent research project using publicly available FDA data.
                Results are not endorsed by or representative of FDA views.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Q: Can I access the code and data?</h4>
              <p className="text-gray-700 text-sm">
                Yes! This project is open-source. Visit the{' '}
                <a href="https://github.com/inventcures/fda_crl_analysis" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline inline-flex items-center gap-1">
                  GitHub repository <ExternalLink size={14} />
                </a>
                {' '}for all code, analysis notebooks, and parsed data.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Q: How often is the data updated?</h4>
              <p className="text-gray-700 text-sm">
                Currently a static snapshot from December 2025. OpenFDA adds new CRLs periodically.
                Future versions may include automated updates.
              </p>
            </div>
          </div>
        </section>

        {/* Built By */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-8 mb-8 border-l-4 border-fda-blue">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-fda-blue text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
              AM
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Built by Ashish Makani</h3>
              <p className="text-gray-600">Healthcare innovation & computational biology</p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <a
              href="https://x.com/inventcures"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow on X
            </a>
            <a
              href="https://inventcures.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-fda-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <ExternalLink size={18} />
              Visit Homepage
            </a>
            <a
              href="https://github.com/inventcures/fda_crl_analysis"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </section>

        {/* Resources */}
        <section className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-3">Additional Resources</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              •{' '}
              <a href="https://www.fda.gov/news-events/press-announcements/fda-embraces-radical-transparency-publishing-complete-response-letters" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline">
                FDA Transparency Announcement
              </a>
            </li>
            <li>
              •{' '}
              <a href="https://www.accessdata.fda.gov/scripts/cder/daf/" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline">
                Drugs@FDA Database
              </a>
            </li>
            <li>
              •{' '}
              <a href="https://www.fda.gov/regulatory-information/search-fda-guidance-documents/guidance-industry-responding-complete-response-letters" target="_blank" rel="noopener noreferrer" className="text-fda-blue hover:underline">
                FDA Guidance: Responding to CRLs
              </a>
            </li>
            <li>
              • BMJ 2015 CRL Study: DOI 10.1136/bmj.h2758
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/data/overview.json')
      .then(res => res.json())
      .then(data => setStats(data.summary))
      .catch(console.error)
  }, [])

  return (
    <div className="bg-page min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-border-light pt-32 pb-24">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              FDA Analysis 2020-2025
            </div>

            <h1 className="text-6xl md:text-7xl font-normal text-text-primary leading-[1.1] tracking-tight">
              The Logic of <br />
              <span className="text-text-secondary">Rejection.</span>
            </h1>

            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-2xl font-light">
              We analyzed nearly 300 FDA Complete Response Letters to map the hidden landscape of drug approval.
              Here is the blueprint of what separates success from failure.
            </p>

            <div className="flex flex-wrap gap-5 pt-8">
              <Link
                href="/overview"
                className="px-8 py-4 bg-accent text-white font-mono text-sm hover:bg-accent-hover transition-all shadow-sm hover:shadow-md"
              >
                READ THE ANALYSIS
              </Link>
              <Link
                href="/search"
                className="px-8 py-4 border border-border-medium text-text-primary font-mono text-sm hover:border-accent hover:text-accent transition-colors"
              >
                SEARCH DATABASE
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Minimalist */}
      {stats && (
        <section className="py-16 border-b border-border-light bg-subtle">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <div className="space-y-2">
                <div className="text-5xl font-mono text-text-primary">{stats.total_crls}</div>
                <div className="text-xs font-mono text-text-secondary uppercase tracking-widest">Letters Parsed</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-mono text-success">{stats.approved}</div>
                <div className="text-xs font-mono text-text-secondary uppercase tracking-widest">Eventually Approved</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-mono text-error">{stats.unapproved}</div>
                <div className="text-xs font-mono text-text-secondary uppercase tracking-widest">Terminated</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-mono text-text-primary">{stats.approval_rate}%</div>
                <div className="text-xs font-mono text-text-secondary uppercase tracking-widest">Rescue Rate</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Narrative Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-4xl text-text-primary mb-6">The Hidden Patterns</h2>
            <p className="text-xl text-text-secondary font-light leading-relaxed">
              Rejection isn't random. By decoding the regulatory language, we found distinct signatures that predict whether a drug will eventually reach patients or be abandoned.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Insight 1 */}
            <div className="group cursor-default">
              <div className="border-t-2 border-text-primary pt-6 mb-4">
                <span className="font-mono text-sm text-text-secondary">01</span>
              </div>
              <h3 className="text-2xl text-text-primary mb-4 group-hover:text-accent transition-colors">
                Safety is rarely the dealbreaker.
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                While safety concerns appear in 31% of letters, they are surprisingly recoverable. The real killers are often bureaucratic and manufacturing hurdles that drain resources and time.
              </p>
              <div className="bg-subtle p-6 rounded-sm">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-mono text-sm text-text-secondary">Clinical Deficiencies</span>
                  <span className="font-mono text-xl text-text-primary">47%</span>
                </div>
                <div className="w-full bg-border-light h-1">
                  <div className="bg-text-primary h-1" style={{ width: '47%' }}></div>
                </div>
              </div>
            </div>

            {/* Insight 2 */}
            <div className="group cursor-default">
              <div className="border-t-2 border-border-medium pt-6 mb-4 group-hover:border-text-primary transition-colors">
                <span className="font-mono text-sm text-text-secondary">02</span>
              </div>
              <h3 className="text-2xl text-text-primary mb-4 group-hover:text-accent transition-colors">
                The Trial Trap.
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                The single strongest predictor of failure is the requirement for a new clinical trial. If the FDA asks for more data, the odds of approval drop precipitously.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-subtle p-4">
                  <div className="text-3xl font-mono text-success mb-1">93%</div>
                  <div className="text-xs text-text-secondary">Approval without new trial</div>
                </div>
                <div className="bg-subtle p-4">
                  <div className="text-3xl font-mono text-error mb-1">31%</div>
                  <div className="text-xs text-text-secondary">Approval with new trial</div>
                </div>
              </div>
            </div>

            {/* Insight 3 */}
            <div className="group cursor-default">
              <div className="border-t-2 border-border-medium pt-6 mb-4 group-hover:border-text-primary transition-colors">
                <span className="font-mono text-sm text-text-secondary">03</span>
              </div>
              <h3 className="text-2xl text-text-primary mb-4 group-hover:text-accent transition-colors">
                The Language of Failure.
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                We trained models to "read" the tone of FDA letters. Unapproved drugs receive letters with significantly harsher, more directive regulatory language.
              </p>
              <div className="flex items-center gap-4 text-sm font-mono">
                <span className="text-error">Severity Score: 0.52</span>
                <span className="text-border-medium">vs</span>
                <span className="text-success">0.48 (Approved)</span>
              </div>
            </div>

            {/* Insight 4 */}
            <div className="group cursor-default">
              <div className="border-t-2 border-border-medium pt-6 mb-4 group-hover:border-text-primary transition-colors">
                <span className="font-mono text-sm text-text-secondary">04</span>
              </div>
              <h3 className="text-2xl text-text-primary mb-4 group-hover:text-accent transition-colors">
                Predicting Outcomes.
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                Using just a few key features from the initial rejection letter, our Random Forest model can predict the ultimate fate of a drug with 72% accuracy.
              </p>
              <Link href="/predictive" className="inline-flex items-center text-accent hover:text-accent-hover font-mono text-sm group-hover:translate-x-1 transition-transform">
                VIEW MODEL PERFORMANCE &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Grid */}
      <section className="py-24 bg-subtle border-t border-border-light">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl text-text-primary">Dive Deeper</h2>
            <span className="font-mono text-sm text-text-secondary">EXPLORE THE DATASET</span>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border-light border border-border-light">
            <Link href="/overview" className="bg-white p-10 hover:bg-gray-50 transition-colors group">
              <div className="font-mono text-xs text-accent mb-4">01</div>
              <h3 className="text-xl text-text-primary mb-3 group-hover:text-accent transition-colors">Overview</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Comprehensive breakdown of approval rates, temporal trends, and application types.
              </p>
            </Link>

            <Link href="/deficiencies" className="bg-white p-10 hover:bg-gray-50 transition-colors group">
              <div className="font-mono text-xs text-accent mb-4">02</div>
              <h3 className="text-xl text-text-primary mb-3 group-hover:text-accent transition-colors">Deficiencies</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Deep dive into what actually goes wrong. Heatmaps of co-occurring issues.
              </p>
            </Link>

            <Link href="/language" className="bg-white p-10 hover:bg-gray-50 transition-colors group">
              <div className="font-mono text-xs text-accent mb-4">03</div>
              <h3 className="text-xl text-text-primary mb-3 group-hover:text-accent transition-colors">Language</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                NLP analysis of regulatory tone, sentiment, and semantic embeddings.
              </p>
            </Link>

            <Link href="/predictive" className="bg-white p-10 hover:bg-gray-50 transition-colors group">
              <div className="font-mono text-xs text-accent mb-4">04</div>
              <h3 className="text-xl text-text-primary mb-3 group-hover:text-accent transition-colors">Prediction</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Machine learning models that forecast drug rescue probability.
              </p>
            </Link>

            <Link href="/search" className="bg-white p-10 hover:bg-gray-50 transition-colors group md:col-span-2">
              <div className="font-mono text-xs text-accent mb-4">05</div>
              <h3 className="text-xl text-text-primary mb-3 group-hover:text-accent transition-colors">Search the Database</h3>
              <p className="text-text-secondary text-sm leading-relaxed max-w-md">
                Full-text search across all 297 Complete Response Letters with integrated PDF viewer and highlighting.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

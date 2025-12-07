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
    <div>
      {/* Hero Section - Clean, Academic */}
      <section className="bg-white border-b border-border-light py-20">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-accent-subtle border border-accent-light text-accent text-sm font-medium">
              FDA Research Analysis • 2020-2025
            </div>

            <h1 className="text-5xl font-bold text-text-primary leading-tight">
              Understanding Drug Approval Patterns Through Complete Response Letter Analysis
            </h1>

            <p className="text-xl text-text-secondary leading-relaxed max-w-3xl">
              Analyzing 297 FDA Complete Response Letters to identify patterns that distinguish
              drugs that eventually get approved from those that don't. A systematic study using
              natural language processing, machine learning, and statistical analysis.
            </p>

            <div className="flex gap-4 pt-4">
              <Link
                href="/search"
                className="px-6 py-3 bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
              >
                Explore CRLs
              </Link>
              <Link
                href="/methodology"
                className="px-6 py-3 border border-border-medium text-text-primary hover:border-accent transition-colors"
              >
                Methodology
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Simple Grid */}
      {stats && (
        <section className="py-12 bg-subtle border-b border-border-light">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-text-primary">{stats.total_crls}</div>
                <div className="text-sm text-text-secondary mt-2">Total CRLs Analyzed</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-success">{stats.approved}</div>
                <div className="text-sm text-text-secondary mt-2">Eventually Approved</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-error">{stats.unapproved}</div>
                <div className="text-sm text-text-secondary mt-2">Not Yet Approved</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-text-primary">{stats.approval_rate}%</div>
                <div className="text-sm text-text-secondary mt-2">Overall Rescue Rate</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Key Findings */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-text-primary mb-3">Key Findings</h2>
            <p className="text-lg text-text-secondary">
              Critical insights from analyzing Complete Response Letters
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Finding 1 */}
            <div className="bg-white border border-border-light p-8 hover:border-accent transition-colors">
              <h3 className="text-2xl font-semibold text-text-primary mb-4">
                Deficiency Patterns
              </h3>
              <div className="space-y-3 text-text-secondary">
                <div className="pb-3 border-b border-border-light">
                  <div className="flex justify-between items-baseline">
                    <span>Clinical deficiencies</span>
                    <span className="font-semibold text-text-primary">47%</span>
                  </div>
                </div>
                <div className="pb-3 border-b border-border-light">
                  <div className="flex justify-between items-baseline">
                    <span>CMC/Manufacturing issues</span>
                    <span className="font-semibold text-text-primary">42%</span>
                  </div>
                </div>
                <div className="pb-3">
                  <div className="flex justify-between items-baseline">
                    <span>Safety concerns</span>
                    <span className="font-semibold text-text-primary">31%</span>
                  </div>
                  <p className="text-sm mt-1">Minimal impact on approval outcomes</p>
                </div>
              </div>
            </div>

            {/* Finding 2 */}
            <div className="bg-white border border-border-light p-8 hover:border-accent transition-colors">
              <h3 className="text-2xl font-semibold text-text-primary mb-4">
                Strongest Approval Predictors
              </h3>
              <div className="space-y-3 text-text-secondary">
                <div className="pb-3 border-b border-border-light">
                  <div className="flex justify-between items-baseline mb-1">
                    <span>No new trial required</span>
                    <span className="font-semibold text-success">93%</span>
                  </div>
                  <p className="text-sm">approval rate</p>
                </div>
                <div className="pb-3 border-b border-border-light">
                  <div className="flex justify-between items-baseline mb-1">
                    <span>New trial required</span>
                    <span className="font-semibold text-error">31%</span>
                  </div>
                  <p className="text-sm">approval rate</p>
                </div>
                <div>
                  <p>ANDAs significantly outperform NDAs and BLAs in rescue rates</p>
                </div>
              </div>
            </div>

            {/* Finding 3 */}
            <div className="bg-white border border-border-light p-8 hover:border-accent transition-colors">
              <h3 className="text-2xl font-semibold text-text-primary mb-4">
                Language Analysis
              </h3>
              <div className="space-y-3 text-text-secondary">
                <div className="pb-3 border-b border-border-light">
                  <div className="flex justify-between items-baseline">
                    <span>Unapproved CRL severity score</span>
                    <span className="font-semibold text-error">0.52</span>
                  </div>
                </div>
                <div className="pb-3 border-b border-border-light">
                  <div className="flex justify-between items-baseline">
                    <span>Approved CRL severity score</span>
                    <span className="font-semibold text-success">0.48</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm">
                    Unapproved CRLs use significantly more severe regulatory language
                    and request fundamentally different types of actions from sponsors
                  </p>
                </div>
              </div>
            </div>

            {/* Finding 4 */}
            <div className="bg-white border border-border-light p-8 hover:border-accent transition-colors">
              <h3 className="text-2xl font-semibold text-text-primary mb-4">
                Predictive Modeling
              </h3>
              <div className="space-y-4">
                <div className="bg-subtle border border-border-light p-4">
                  <div className="text-5xl font-bold text-accent mb-2">72%</div>
                  <div className="text-sm text-text-secondary">
                    Random Forest cross-validated accuracy
                  </div>
                </div>
                <p className="text-text-secondary">
                  Top predictive features: new trial requirement, application type,
                  and total deficiency count
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Sections */}
      <section className="py-16 bg-subtle border-t border-border-light">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-text-primary mb-3">Explore the Analysis</h2>
            <p className="text-lg text-text-secondary">
              Detailed breakdowns and interactive visualizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/overview" className="block group">
              <div className="bg-white border border-border-light p-8 h-full hover:border-accent transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  Overview
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Approval rates, application type breakdowns, and temporal trends across the dataset
                </p>
              </div>
            </Link>

            <Link href="/deficiencies" className="block group">
              <div className="bg-white border border-border-light p-8 h-full hover:border-accent transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  Deficiency Analysis
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Deficiency type patterns, rescue rates by category, and co-occurrence heatmaps
                </p>
              </div>
            </Link>

            <Link href="/language" className="block group">
              <div className="bg-white border border-border-light p-8 h-full hover:border-accent transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  Language & NLP
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Word frequency, sentiment analysis, semantic embeddings, and topic modeling
                </p>
              </div>
            </Link>

            <Link href="/predictive" className="block group">
              <div className="bg-white border border-border-light p-8 h-full hover:border-accent transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  Predictive Models
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Machine learning classifiers, ROC curves, feature importance, and model performance
                </p>
              </div>
            </Link>

            <Link href="/search" className="block group">
              <div className="bg-white border border-border-light p-8 h-full hover:border-accent transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  Search CRLs
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Full-text search across all 297 letters with integrated PDF viewer
                </p>
              </div>
            </Link>

            <Link href="/methodology" className="block group">
              <div className="bg-white border border-border-light p-8 h-full hover:border-accent transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  Methodology
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Data sources, analysis methods, validation approaches, and study limitations
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-16 bg-white border-t border-border-light">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-text-primary mb-4">
            Start Exploring
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Search through Complete Response Letters or explore patterns in the data
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-3 bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
            >
              Search CRLs
            </Link>
            <Link
              href="/overview"
              className="px-8 py-3 border border-border-medium text-text-primary hover:border-accent transition-colors"
            >
              View Analysis
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

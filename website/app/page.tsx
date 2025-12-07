'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, FileText, BarChart3, Brain, TrendingUp, CheckCircle, XCircle, Zap } from 'lucide-react'

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
      {/* Hero Section - Gradient Background */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-24 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-sm font-semibold">FDA Research • 2020-2025</span>
            </div>
          </div>

          <h1 className="text-6xl font-bold mb-6 leading-tight">
            FDA Complete Response Letter
            <br />
            <span className="text-blue-300">Intelligence Platform</span>
          </h1>

          <p className="text-xl mb-8 text-blue-100 max-w-3xl leading-relaxed">
            Unlock insights from ~300 FDA rejection letters using advanced NLP, machine learning,
            and interactive data visualization. Predict approval outcomes with 72% accuracy.
          </p>

          <div className="flex gap-4 mb-12">
            <Link
              href="/overview"
              className="group bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              Explore Insights
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/methodology"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Methodology
            </Link>
          </div>

          {/* Live Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{stats.total_crls}</div>
                <div className="text-sm text-blue-200">Total CRLs</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1 text-green-300">{stats.approved}</div>
                <div className="text-sm text-blue-200">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1 text-red-300">{stats.unapproved}</div>
                <div className="text-sm text-blue-200">Unapproved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1 text-yellow-300">{stats.approval_rate}%</div>
                <div className="text-sm text-blue-200">Approval Rate</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Key Findings - Card Grid */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Key Findings</h2>
            <p className="text-xl text-gray-600">Data-driven insights from 300+ FDA Complete Response Letters</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="group bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg">
                  <FileText className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-800">Deficiency Patterns</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span><strong>Clinical deficiencies:</strong> 47% of CRLs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span><strong>CMC issues:</strong> 42% of CRLs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span><strong>Safety concerns:</strong> 31% (minimal impact on outcomes)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg">
                  <TrendingUp className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-800">Top Approval Predictors</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={18} />
                      <span><strong>New trial NOT required:</strong> 93% approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="text-red-500" size={18} />
                      <span><strong>New trial required:</strong> 31% approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="text-yellow-500" size={18} />
                      <span><strong>ANDAs outperform NDAs/BLAs</strong> significantly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg">
                  <Brain className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-800">Language Patterns</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Severity (Unapproved):</span>
                      <strong className="text-red-600">0.52</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Severity (Approved):</span>
                      <strong className="text-green-600">0.48</strong>
                    </div>
                    <p className="text-sm pt-2 border-t">
                      Unapproved CRLs use significantly more severe FDA language and request different action types
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-lg">
                  <BarChart3 className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-800">Machine Learning</h3>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
                      <div className="text-3xl font-bold text-orange-600 mb-1">72%</div>
                      <div className="text-sm text-gray-600">Random Forest Accuracy</div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Top features: new trial requests, application type, deficiency counts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Dashboards - Interactive Cards */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Explore Interactive Dashboards</h2>
            <p className="text-xl text-gray-600">Dive deep into the data with dynamic visualizations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/overview" className="group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 h-full text-white hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg inline-block mb-4">
                  <BarChart3 size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Overview Dashboard
                </h3>
                <p className="text-blue-100 mb-4">
                  Interactive charts showing approval rates, application types, and temporal trends
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  View Dashboard <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/deficiencies" className="group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 h-full text-white hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg inline-block mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Deficiency Analysis
                </h3>
                <p className="text-green-100 mb-4">
                  Explore deficiency patterns, rescue rates, and co-occurrence heatmaps
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  Explore Deficiencies <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/language" className="group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 h-full text-white hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg inline-block mb-4">
                  <Brain size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Language & NLP
                </h3>
                <p className="text-purple-100 mb-4">
                  Word clouds, sentiment analysis, embeddings, and topic modeling
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  View Language Patterns <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/predictive" className="group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 h-full text-white hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg inline-block mb-4">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Predictive Models
                </h3>
                <p className="text-orange-100 mb-4">
                  ML classifiers, ROC curves, feature importance, and performance metrics
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  See Predictions <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/methodology" className="group">
              <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-8 h-full text-white hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg inline-block mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Methodology
                </h3>
                <p className="text-gray-200 mb-4">
                  Data sources, analysis methods, validation, and study limitations
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  Read Methodology <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/about" className="group">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-8 h-full text-white hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg inline-block mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  About & FAQ
                </h3>
                <p className="text-indigo-100 mb-4">
                  Project background, use cases, and frequently asked questions
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  Learn More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Unlock FDA Insights?</h2>
          <p className="text-xl text-blue-200 mb-8">
            Start exploring patterns in Complete Response Letters with interactive data visualizations
          </p>
          <Link
            href="/overview"
            className="inline-block bg-white text-blue-900 px-10 py-5 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Explore Dashboards →
          </Link>
        </div>
      </section>
    </div>
  )
}

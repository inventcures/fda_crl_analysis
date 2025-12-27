'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, FileText, CheckCircle, TrendingUp } from 'lucide-react'

interface OverviewSummary {
  total_crls: number
  approved: number
  unapproved: number
  approval_rate: number
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<OverviewSummary | null>(null)

  useEffect(() => {
    fetch('/data/overview.json')
      .then(res => res.json())
      .then(data => setStats(data.summary))
      .catch(err => console.error('Failed to load nav stats:', err))
  }, [])

  const links = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Search' },
    { href: '/overview', label: 'Overview' },
    { href: '/deficiencies', label: 'Deficiencies' },
    { href: '/language', label: 'Language' },
    { href: '/predictive', label: 'Predictions' },
    { href: '/oncology', label: 'Oncology' },
    { href: '/methodology', label: 'Methodology' },
    { href: '/document-view', label: 'Document View' },
    { href: 'https://docs.google.com/document/d/1P7UIii0E6CLk7iLnDqs4eZ3cS4uqJORGi3KOZr5eI_c/edit?usp=sharing', label: 'Report', external: true },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav className="bg-white border-b border-border-light sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center py-3 gap-4">
          
          {/* Logo & Mobile Toggle */}
          <div className="flex justify-between items-center w-full md:w-auto">
            <Link href="/" className="flex items-center gap-3">
              <span className="font-bold text-text-primary text-xl tracking-tight">
                FDA CRL Analysis
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-text-secondary hover:text-accent"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Stats Panels (Desktop) */}
          {stats && (
            <div className="hidden lg:flex items-center gap-4 bg-subtle px-4 py-2 rounded-lg border border-border-light">
              <div className="flex items-center gap-2 pr-4 border-r border-border-light">
                <FileText size={16} className="text-text-secondary" />
                <span className="text-xs uppercase text-text-secondary font-semibold">Total</span>
                <span className="font-mono font-bold text-text-primary">{stats.total_crls}</span>
              </div>
              <div className="flex items-center gap-2 pr-4 border-r border-border-light">
                <CheckCircle size={16} className="text-emerald-500" />
                <span className="text-xs uppercase text-text-secondary font-semibold">Approved</span>
                <span className="font-mono font-bold text-emerald-600">{stats.approved}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                <span className="text-xs uppercase text-text-secondary font-semibold">Rate</span>
                <span className="font-mono font-bold text-blue-600">{stats.approval_rate}%</span>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1">
            {links.map((link) => (
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-sm text-text-secondary hover:text-accent hover:bg-gray-50 rounded-md transition-all font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-text-secondary hover:text-accent hover:bg-gray-50 rounded-md transition-all font-medium"
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border-light mt-2 pt-2">
            {/* Mobile Stats */}
            {stats && (
              <div className="flex justify-around mb-4 bg-gray-50 p-3 rounded-md">
                 <div className="text-center">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="font-bold">{stats.total_crls}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xs text-gray-500">Approved</div>
                    <div className="font-bold text-emerald-600">{stats.approved}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xs text-gray-500">Rate</div>
                    <div className="font-bold text-blue-600">{stats.approval_rate}%</div>
                 </div>
              </div>
            )}
            {links.map((link) => (
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 px-2 text-text-secondary hover:text-accent hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 px-2 text-text-secondary hover:text-accent hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

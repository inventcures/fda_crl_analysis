'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  FileText,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  BarChart3,
  GitBranch,
  Info,
  ExternalLink,
  Microscope,
  MessageSquareText,
  Brain,
  FlaskConical,
  Clock,
  Scale,
  ArrowRight,
  BookOpen,
  Users,
} from 'lucide-react'

interface OverviewSummary {
  total_crls: number
  approved: number
  unapproved: number
  approval_rate: number
}

interface NavItem {
  href: string
  label: string
  description?: string
  icon?: React.ReactNode
  external?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// Navigation structure
const navGroups: NavGroup[] = [
  {
    label: 'Analysis',
    items: [
      { href: '/overview', label: 'Overview', description: 'High-level statistics and trends', icon: <BarChart3 className="w-4 h-4" /> },
      { href: '/deficiencies', label: 'Deficiencies', description: 'Deficiency patterns and rescue rates', icon: <Microscope className="w-4 h-4" /> },
      { href: '/language', label: 'Language', description: 'NLP analysis of CRL text', icon: <MessageSquareText className="w-4 h-4" /> },
      { href: '/predictive', label: 'Predictions', description: 'ML models for outcome prediction', icon: <Brain className="w-4 h-4" /> },
      { href: '/oncology', label: 'Oncology', description: 'Oncology-specific deep dive', icon: <FlaskConical className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Explore',
    items: [
      { href: '/journey', label: 'Journey', description: 'Sankey flow from deficiencies to outcomes', icon: <GitBranch className="w-4 h-4" /> },
      { href: '/timeline', label: 'Timeline', description: 'Temporal distribution of CRLs', icon: <Clock className="w-4 h-4" /> },
      { href: '/compare', label: 'Compare', description: 'Side-by-side CRL comparison', icon: <Scale className="w-4 h-4" /> },
    ]
  },
  {
    label: 'About',
    items: [
      { href: '/methodology', label: 'Methodology', description: 'How the analysis was conducted', icon: <BookOpen className="w-4 h-4" /> },
      { href: 'https://docs.google.com/document/d/1vab8o8PoSyGJdtFYLQk0zHD56Cvmo5VlmNPlBQyBURo/edit?usp=sharing', label: 'Report', description: 'Full research report', icon: <ExternalLink className="w-4 h-4" />, external: true },
      { href: '/about', label: 'About', description: 'About this project', icon: <Users className="w-4 h-4" /> },
    ]
  }
]

// Dropdown component for desktop
function NavDropdown({ group, isActive }: { group: NavGroup; isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
          isActive
            ? 'text-accent bg-accent-light'
            : 'text-text-secondary hover:text-accent hover:bg-gray-50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {group.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
          >
            {group.items.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-gray-400 group-hover:text-accent mt-0.5">
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-accent flex items-center gap-1">
                      {item.label}
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </div>
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-gray-400 group-hover:text-accent mt-0.5">
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-accent">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </div>
                </Link>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Mobile accordion section
function MobileNavSection({
  group,
  isExpanded,
  onToggle,
  onNavigate
}: {
  group: NavGroup
  isExpanded: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <span className="font-medium text-gray-900">{group.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-2 px-2">
              {group.items.map((item) => (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={onNavigate}
                  >
                    <span className="text-gray-400">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={onNavigate}
                  >
                    <span className="text-gray-400">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<OverviewSummary | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/data/overview.json')
      .then(res => res.json())
      .then(data => setStats(data.summary))
      .catch(err => console.error('Failed to load nav stats:', err))
  }, [])

  // Check if a group contains the current path
  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => pathname === item.href)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <nav className="bg-white border-b border-border-light sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <span className="font-bold text-text-primary text-xl tracking-tight">
              FDA CRL Analysis
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Documents - Primary CTA */}
            <Link
              href="/document-view"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                pathname === '/document-view'
                  ? 'text-accent bg-accent-light'
                  : 'text-text-secondary hover:text-accent hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </Link>

            {/* Dropdown groups */}
            {navGroups.map((group) => (
              <NavDropdown
                key={group.label}
                group={group}
                isActive={isGroupActive(group)}
              />
            ))}
          </div>

          {/* Stats Panel (Desktop) */}
          {stats && (
            <div className="hidden xl:flex items-center gap-4 bg-subtle px-4 py-2 rounded-lg border border-border-light ml-4">
              <div className="flex items-center gap-2 pr-4 border-r border-border-light">
                <FileText size={14} className="text-text-secondary" />
                <span className="text-xs uppercase text-text-secondary font-semibold">Total</span>
                <span className="font-mono font-bold text-text-primary text-sm">{stats.total_crls}</span>
              </div>
              <div className="flex items-center gap-2 pr-4 border-r border-border-light">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-xs uppercase text-text-secondary font-semibold">Approved</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">{stats.approved}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-500" />
                <span className="text-xs uppercase text-text-secondary font-semibold">Rate</span>
                <span className="font-mono font-bold text-blue-600 text-sm">{stats.approval_rate}%</span>
              </div>
            </div>
          )}

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-text-secondary hover:text-accent hover:bg-gray-50 rounded-md transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-border-light"
            >
              {/* Mobile Stats */}
              {stats && (
                <div className="flex justify-around py-4 bg-gray-50 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase">Total</div>
                    <div className="font-bold text-gray-900">{stats.total_crls}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase">Approved</div>
                    <div className="font-bold text-emerald-600">{stats.approved}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase">Rate</div>
                    <div className="font-bold text-blue-600">{stats.approval_rate}%</div>
                  </div>
                </div>
              )}

              {/* Primary Links */}
              <div className="py-2 border-b border-gray-100">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">Home</span>
                </Link>
                <Link
                  href="/document-view"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">Documents</span>
                </Link>
              </div>

              {/* Accordion Sections */}
              <div className="py-2">
                {navGroups.map((group) => (
                  <MobileNavSection
                    key={group.label}
                    group={group}
                    isExpanded={expandedSection === group.label}
                    onToggle={() => setExpandedSection(
                      expandedSection === group.label ? null : group.label
                    )}
                    onNavigate={() => setIsOpen(false)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

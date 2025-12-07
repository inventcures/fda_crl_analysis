'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Search' },
    { href: '/overview', label: 'Overview' },
    { href: '/deficiencies', label: 'Deficiencies' },
    { href: '/language', label: 'Language' },
    { href: '/predictive', label: 'Predictions' },
    { href: '/oncology', label: 'Oncology' },
    { href: '/methodology', label: 'Methodology' },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav className="bg-white border-b border-border-light sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-semibold text-text-primary text-lg">
              FDA CRL Analysis
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-secondary hover:text-accent transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-text-secondary hover:text-accent"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border-light mt-4 pt-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-text-secondary hover:text-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

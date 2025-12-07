import Link from 'next/link'
import { Github, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border-light py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-text-primary font-semibold text-lg mb-4">About This Project</h3>
            <p className="text-sm text-text-secondary mb-4">
              An open-source analysis of FDA Complete Response Letters to understand
              patterns in drug approval outcomes.
            </p>
            <div className="space-y-2">
              <a
                href="https://github.com/inventcures/fda_crl_analysis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:underline block"
              >
                <Github size={20} />
                View on GitHub
              </a>
              <div className="text-sm text-text-secondary">
                Built by{' '}
                <a
                  href="https://inventcures.github.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Ashish Makani
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-text-primary font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://open.fda.gov/crltable/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:underline flex items-center gap-1"
                >
                  OpenFDA CRL Table <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.fda.gov/news-events/press-announcements/fda-embraces-radical-transparency-publishing-complete-response-letters"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:underline flex items-center gap-1"
                >
                  FDA Transparency Policy <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.accessdata.fda.gov/scripts/cder/daf/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:underline flex items-center gap-1"
                >
                  Drugs@FDA Database <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-text-primary font-semibold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/overview" className="text-text-secondary hover:underline">Overview</Link></li>
              <li><Link href="/deficiencies" className="text-text-secondary hover:underline">Deficiencies</Link></li>
              <li><Link href="/language" className="text-text-secondary hover:underline">Language</Link></li>
              <li><Link href="/predictive" className="text-text-secondary hover:underline">Predictions</Link></li>
              <li><Link href="/methodology" className="text-text-secondary hover:underline">Methodology</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-light mt-8 pt-8 text-sm text-center text-text-secondary">
          <p>
            Built with Next.js • Data from{' '}
            <a
              href="https://open.fda.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              OpenFDA
            </a>
          </p>
          <p className="mt-2">
            © 2025 • For research and educational purposes
          </p>
        </div>
      </div>
    </footer>
  )
}

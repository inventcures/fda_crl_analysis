import { ReactNode } from 'react'

export default function PDFViewerLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden m-0 p-0">
        {children}
      </body>
    </html>
  )
}

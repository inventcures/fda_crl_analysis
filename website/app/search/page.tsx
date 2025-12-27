import { redirect } from 'next/navigation'

// Redirect /search to /document-view (unified search + document browser)
export default function SearchPage() {
  redirect('/document-view')
}

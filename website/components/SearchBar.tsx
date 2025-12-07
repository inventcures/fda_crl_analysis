'use client'

import { Search, X } from 'lucide-react'
import { useState } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultCount?: number
  isSearching?: boolean
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search CRLs by drug name, sponsor, deficiencies...',
  resultCount,
  isSearching,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="w-full">
      <div
        className={`relative flex items-center border-2 rounded-lg transition-all ${
          isFocused
            ? 'border-fda-blue shadow-lg'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Search
          className={`absolute left-4 transition-colors ${
            isFocused ? 'text-fda-blue' : 'text-gray-400'
          }`}
          size={20}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 text-lg rounded-lg focus:outline-none"
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {isSearching && resultCount !== undefined && (
        <div className="mt-2 text-sm text-gray-600">
          Found <strong>{resultCount}</strong> result{resultCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

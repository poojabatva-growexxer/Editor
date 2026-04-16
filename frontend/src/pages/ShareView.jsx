import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import { documentService } from '../services/document.service.js'
import { Block } from '../components/blocks/index.js'

export default function ShareView() {
  const { token }      = useParams()
  const { dark, toggle } = useTheme()

  const [doc,     setDoc]     = useState(null)
  const [blocks,  setBlocks]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let active = true

    documentService.getPublic(token)
      .then(res => {
        const data = res.data?.document ?? res.data ?? null
        if (!active) return
        setDoc(data)
        setBlocks(data?.blocks ?? [])
      })
      .catch(err => {
        if (!active) return
        if (err.status === 404) setError('This document is not available or sharing has been disabled.')
        else setError(err.message || 'Something went wrong.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="space-y-3 w-full max-w-xl px-6">
          <div className="h-8 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded animate-pulse" style={{ width: `${50 + i * 10}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p>
        <Link to="/" className="text-xs text-black dark:text-white underline underline-offset-4">
          Go to homepage
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Minimal header */}
      <header className="h-12 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6">
        <Link to="/" className="text-sm font-semibold text-black dark:text-white">Docs</Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full">
            Read only
          </span>
          <button onClick={toggle} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {dark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-8 leading-tight">
          {doc?.title || 'Untitled'}
        </h1>

        <div className="space-y-1">
          {blocks.map((block, i) => (
            <Block
              key={block.id}
              block={block}
              index={i}
              readOnly
              focusBlockId={null}
              setFocusBlockId={() => {}}
              onUpdate={() => {}}
              onCreate={() => {}}
              onDelete={() => {}}
              onSplit={() => {}}
              onChangeType={() => {}}
            />
          ))}
        </div>

        {blocks.length === 0 && (
          <p className="text-gray-400 dark:text-gray-600 text-sm">This document is empty.</p>
        )}
      </main>
    </div>
  )
}

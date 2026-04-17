import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Button } from '../components/ui/Button.jsx'
import { documentService } from '../services/document.service.js'
import { formatRelativeTime } from '../utils/helpers.js'

const BASE_URL = window.location.origin

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function SharedDocCard({ doc, onDisable, onOpen }) {
  const [copied, setCopied] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const shareUrl = `${BASE_URL}/share/${doc.shareToken}`

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  const handleDisable = async (e) => {
    e.stopPropagation()
    setDisabling(true)
    await onDisable(doc.id)
    setDisabling(false)
  }

  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-gray-900/60 transition-all duration-200">
      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        {/* Doc icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500 dark:text-emerald-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => onOpen(doc.id)}
            className="text-left w-full group/title"
          >
            <p className="text-sm font-semibold text-black dark:text-white truncate group-hover/title:text-emerald-600 dark:group-hover/title:text-emerald-400 transition-colors">
              {doc.title || 'Untitled'}
            </p>
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Updated {formatRelativeTime(doc.updatedAt)}
          </p>
        </div>

        {/* Live badge */}
        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Share link box */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 mb-4">
        <LinkIcon />
        <span className="flex-1 min-w-0 text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
          {shareUrl}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Open in new tab"
          >
            <ExternalLinkIcon />
          </a>
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-colors ${copied ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            title="Copy link"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onOpen(doc.id)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
        >
          Open editor
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={handleDisable}
          disabled={disabling}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 hover:border-red-200 dark:hover:border-red-800 transition-all disabled:opacity-50"
          title="Disable sharing"
        >
          {disabling
            ? <span className="w-3 h-3 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" />
            : <EyeOffIcon />
          }
          Disable sharing
        </button>
      </div>
    </div>
  )
}

export default function SharedDocuments() {
  const { user, logout }     = useAuth()
  const { dark, toggle }     = useTheme()
  const navigate             = useNavigate()
  const toast                = useToast()

  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await documentService.list()
      const all = res.data?.documents ?? []
      setDocuments(all.filter(d => d.isPublic && d.shareToken))
    } catch (err) {
      setError(err.message || 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleDisable = async (id) => {
    try {
      await documentService.share(id, false)
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast('Sharing disabled', 'success')
    } catch {
      toast('Could not disable sharing', 'error')
    }
  }

  const sharedCount = documents.length

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top bar */}
      <header className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-base tracking-tight text-black dark:text-white">
            Docs
          </Link>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Shared</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center">
                <LinkIcon />
              </div>
              <h1 className="text-2xl font-bold text-black dark:text-white">Shared Documents</h1>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 ml-10">
              {loading ? 'Loading…' : `${sharedCount} ${sharedCount === 1 ? 'document' : 'documents'} currently shared`}
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Docs
            </Button>
          </Link>
        </div>

        {/* Info banner */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            Anyone with a share link can view these documents in read-only mode.
            Disable sharing to revoke access immediately — the link will stop working.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
                <div className="flex justify-between">
                  <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-6 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sharedCount === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-gray-300 dark:text-gray-600">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-400 dark:text-gray-500 mb-2">No shared documents</p>
            <p className="text-sm text-gray-300 dark:text-gray-600 mb-6 max-w-xs">
              Open any document from the editor and use the share button to generate a public link.
            </p>
            <Link to="/">
              <Button>Go to My Documents</Button>
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && sharedCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <SharedDocCard
                key={doc.id}
                doc={doc}
                onDisable={handleDisable}
                onOpen={(id) => navigate(`/doc/${id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

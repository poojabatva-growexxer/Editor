import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDocuments } from '../hooks/useDocuments.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Button } from '../components/ui/Button.jsx'
import { formatRelativeTime } from '../utils/helpers.js'

function DocCard({ doc, onRename, onDelete, onClick }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle]     = useState(doc.title || 'Untitled')
  const inputRef              = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commitRename = () => {
    setEditing(false)
    const trimmed = title.trim() || 'Untitled'
    setTitle(trimmed)
    if (trimmed !== doc.title) onRename(doc.id, trimmed)
  }

  return (
    <div
      className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:shadow-md dark:hover:shadow-gray-900 transition-all duration-200 cursor-pointer"
      onClick={() => !editing && onClick(doc.id)}
    >
      {/* Doc icon */}
      <div className="w-10 h-10 mb-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>

      {/* Title */}
      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') { setEditing(false); setTitle(doc.title || 'Untitled') }
          }}
          onClick={e => e.stopPropagation()}
          className="w-full text-sm font-semibold bg-transparent border-b border-black dark:border-white outline-none text-black dark:text-white pb-0.5"
        />
      ) : (
        <p className="text-sm font-semibold text-black dark:text-white truncate leading-snug">
          {title || 'Untitled'}
        </p>
      )}

      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        {formatRelativeTime(doc.updatedAt)}
      </p>

      {/* Actions */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Rename"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          title="Delete"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout }             = useAuth()
  const { dark, toggle }             = useTheme()
  const { documents, loading, error, create, rename, remove } = useDocuments()
  const navigate                     = useNavigate()
  const toast                        = useToast()
  const [creating, setCreating]      = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const doc = await create('Untitled')
      navigate(`/doc/${doc.id}`)
    } catch {
      toast('Could not create document', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    try {
      await remove(id)
      toast('Document deleted', 'success')
    } catch {
      toast('Could not delete document', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top bar */}
      <header className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6">
        <span className="font-bold text-base tracking-tight text-black dark:text-white">Docs</span>
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
          <Link
            to="/shared"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:text-black dark:hover:text-white transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Shared
          </Link>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">My Documents</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </p>
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New document
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No documents yet</p>
            <Button onClick={handleCreate} disabled={creating}>Create your first document</Button>
          </div>
        )}

        {/* Grid */}
        {!loading && documents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map(doc => (
              <DocCard
                key={doc.id}
                doc={doc}
                onRename={rename}
                onDelete={handleDelete}
                onClick={(id) => navigate(`/doc/${id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
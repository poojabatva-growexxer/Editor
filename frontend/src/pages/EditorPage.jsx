import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BlockEditor } from '../components/editor/BlockEditor.jsx'
import { Navbar } from '../components/layout/Navbar.jsx'
import { Sidebar } from '../components/layout/Sidebar.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useBlocks, SAVE_STATUS } from '../hooks/useBlocks.js'
import { documentService } from '../services/document.service.js'

export default function EditorPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const toast     = useToast()

  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [shareOpen,    setShareOpen]    = useState(false)
  const [docTitle,     setDocTitle]     = useState('Untitled')
  const [shareData,    setShareData]    = useState(null)   // { isPublic, shareToken }
  const [sharingBusy,  setSharingBusy]  = useState(false)

  const blockState = useBlocks(id)
  const { saveStatus } = blockState

  // Fetch doc meta (title + share info)
  useEffect(() => {
    if (!id) return
    documentService.list()
      .then(res => {
        const doc = res.data.documents.find(d => d.id === id)
        if (!doc) { navigate('/'); return }
        setDocTitle(doc.title || 'Untitled')
        setShareData({ isPublic: doc.isPublic, shareToken: doc.shareToken })
      })
      .catch(() => navigate('/'))
  }, [id, navigate])

  const toggleShare = async () => {
    setSharingBusy(true)
    try {
      const res = await documentService.share(id, !shareData?.isPublic)
      const d   = res.data.document
      setShareData({ isPublic: d.isPublic, shareToken: d.shareToken })
      toast(d.isPublic ? 'Sharing enabled' : 'Sharing disabled', 'success')
    } catch {
      toast('Could not update sharing', 'error')
    } finally {
      setSharingBusy(false)
    }
  }

  const shareUrl = shareData?.shareToken
    ? `${window.location.origin}/share/${shareData.shareToken}`
    : null

  const copyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast('Link copied!', 'success')
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black overflow-hidden">
      {/* Navbar */}
      <div className="flex items-center h-12 border-b border-gray-100 dark:border-gray-800 px-3 gap-2 shrink-0">
        {/* Sidebar toggle (mobile) */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 sm:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="All documents"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        <span className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">{docTitle}</span>

        {/* Save status */}
        <Navbar saveStatus={saveStatus !== SAVE_STATUS.IDLE ? saveStatus : undefined} />

        {/* Share button */}
        <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Editor area */}
        <main className="flex-1 overflow-y-auto">
          <BlockEditor
            initialTitle={docTitle}
            onTitleChange={setDocTitle}
            {...blockState}
          />
        </main>
      </div>

      {/* Share modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share document">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">Public link</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Anyone with the link can view
              </p>
            </div>
            {/* Toggle */}
            <button
              onClick={toggleShare}
              disabled={sharingBusy}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 disabled:opacity-50 flex-shrink-0 ${
                shareData?.isPublic ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 pointer-events-none ${
                shareData?.isPublic ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {shareData?.isPublic && shareUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs bg-transparent text-gray-600 dark:text-gray-300 outline-none truncate"
                />
                <button
                  onClick={copyLink}
                  className="text-xs font-medium text-black dark:text-white shrink-0 hover:opacity-70 transition-opacity"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Viewers cannot edit. Disable sharing to invalidate this link.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Link
              to="/shared"
              onClick={() => setShareOpen(false)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              View all shared docs
            </Link>
            <Button variant="primary" onClick={() => setShareOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

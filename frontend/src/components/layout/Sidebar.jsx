import { Link } from 'react-router-dom'

const TIPS = [
  'Press Enter to split the current paragraph, heading, or to-do block.',
  'Use Shift + Enter inside text blocks when you want a line break instead.',
  'Switch block types from the inline menu to create headings, code, images, dividers, and tasks.',
]

export function Sidebar({ open, onClose }) {
  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={`fixed inset-0 z-20 bg-black/35 transition-opacity sm:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-gray-100 bg-white px-5 py-5 transition-transform dark:border-gray-800 dark:bg-black sm:static sm:z-0 sm:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between sm:justify-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
              Workspace
            </p>
            <h2 className="mt-1 text-lg font-semibold text-black dark:text-white">
              Editor notes
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 sm:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <Link
          to="/"
          onClick={onClose}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          All documents
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/70">
          <p className="text-sm font-medium text-black dark:text-white">Quick tips</p>
          <div className="mt-3 space-y-3">
            {TIPS.map((tip) => (
              <p key={tip} className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                {tip}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-4 dark:border-gray-800">
          <p className="text-sm font-medium text-black dark:text-white">Supported blocks</p>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Paragraphs, headings, code, images, dividers, and to-do items are ready to use.
          </p>
        </div>
      </aside>
    </>
  )
}

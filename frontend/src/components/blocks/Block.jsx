import { useEffect, useRef, useState } from 'react'
import { getBlockPlaceholder } from '../../utils/helpers.js'

const BLOCK_TYPES = [
  { value: 'paragraph', label: 'Paragraph', aliases: ['text', 'p'] },
  { value: 'heading_1', label: 'Heading 1', aliases: ['h1', 'title'] },
  { value: 'heading_2', label: 'Heading 2', aliases: ['h2', 'subtitle'] },
  { value: 'code', label: 'Code', aliases: ['snippet', 'pre'] },
  { value: 'image', label: 'Image', aliases: ['img', 'photo'] },
  { value: 'to_do', label: 'To-do', aliases: ['todo', 'task', 'checklist'] },
  { value: 'divider', label: 'Divider', aliases: ['line', 'hr', 'separator'] },
]

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getTextValue(type, content) {
  if (typeof content === 'string') return content
  if (!isRecord(content)) return ''
  if (type === 'image') return typeof content.url === 'string' ? content.url : ''
  return typeof content.text === 'string' ? content.text : ''
}

function getChecked(content) {
  return isRecord(content) ? Boolean(content.checked) : false
}

function buildContent(type, currentContent, text) {
  const base = isRecord(currentContent) ? currentContent : {}

  if (type === 'divider') return base
  if (type === 'image') return { ...base, url: text }
  if (type === 'to_do') return { ...base, text, checked: Boolean(base.checked) }

  return { ...base, text }
}

function resizeTextarea(node) {
  if (!node) return
  node.style.height = '0px'
  node.style.height = `${node.scrollHeight}px`
}

function getTextClassName(type, checked) {
  const common = 'w-full resize-none bg-transparent text-black outline-none dark:text-white'

  switch (type) {
    case 'heading_1':
      return `${common} text-4xl font-bold leading-tight`
    case 'heading_2':
      return `${common} text-2xl font-semibold leading-tight`
    case 'code':
      return `${common} rounded-2xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-6 dark:border-gray-800 dark:bg-gray-900`
    case 'to_do':
      return `${common} text-base leading-7 ${checked ? 'text-gray-400 line-through dark:text-gray-500' : ''}`
    default:
      return `${common} text-base leading-7`
  }
}

function getMatchingBlockTypes(query) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return BLOCK_TYPES

  return BLOCK_TYPES.filter(({ label, value, aliases = [] }) => {
    const candidates = [label.toLowerCase(), value.toLowerCase(), ...aliases.map((alias) => alias.toLowerCase())]
    return candidates.some((candidate) => candidate.includes(normalizedQuery))
  })
}

export function Block({
  block,
  index,
  readOnly = false,
  focusBlockId,
  setFocusBlockId,
  onUpdate,
  onCreate,
  onDelete,
  onSplit,
  onChangeType,
  onMove,
}) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const textValue = getTextValue(block.type, block.content)
  const checked = getChecked(block.content)
  const isEmptyBlock = textValue.trim().length === 0
  const displayValue = commandMenuOpen ? `/${commandQuery}` : textValue
  const matchingBlockTypes = getMatchingBlockTypes(commandQuery)

  useEffect(() => {
    if (readOnly || focusBlockId !== block.id || !inputRef.current) return

    inputRef.current.focus()

    if (typeof inputRef.current.setSelectionRange === 'function') {
      const end = inputRef.current.value.length
      inputRef.current.setSelectionRange(end, end)
    }

    setFocusBlockId(null)
  }, [block.id, focusBlockId, readOnly, setFocusBlockId, displayValue.length])

  useEffect(() => {
    if (block.type === 'divider' || block.type === 'image' || readOnly) return
    resizeTextarea(inputRef.current)
  }, [block.type, displayValue, readOnly])

  const closeCommandMenu = () => {
    setCommandMenuOpen(false)
    setCommandQuery('')
  }

  const handleInputBlur = () => {
    if (commandMenuOpen) closeCommandMenu()
  }

  const handleChange = (nextText) => {
    if (isEmptyBlock && nextText.startsWith('/')) {
      setCommandMenuOpen(true)
      setCommandQuery(nextText.slice(1))
      return
    }

    closeCommandMenu()
    onUpdate(block.id, buildContent(block.type, block.content, nextText))
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textValue)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleTypeSelection = async (nextType) => {
    closeCommandMenu()

    if (isEmptyBlock && !commandMenuOpen) {
      const created = await onCreate(block.id, index, nextType)
      if (created?.id) setFocusBlockId(created.id)
      return
    }

    await onChangeType(block.id, nextType)
  }

  const handleKeyDown = async (event) => {
    if (readOnly) return

    if (block.type === 'code' && event.key === 'Tab') {
      event.preventDefault()
      const textarea = event.currentTarget
      const start = textarea.selectionStart ?? textValue.length
      const end = textarea.selectionEnd ?? textValue.length
      const spaces = '  '
      const nextText = `${textValue.slice(0, start)}${spaces}${textValue.slice(end)}`

      onUpdate(block.id, buildContent(block.type, block.content, nextText))

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length
      }, 0)
      return
    }

    if (commandMenuOpen) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeCommandMenu()
        return
      }

      if (event.key === 'Backspace') {
        if (commandQuery.length === 0) {
          event.preventDefault()
          closeCommandMenu()
        }
        return
      }

      if (event.key === 'Enter' || event.key === 'NumpadEnter') {
        event.preventDefault()
        if (matchingBlockTypes.length > 0) {
          await handleTypeSelection(matchingBlockTypes[0].value)
        }
        return
      }
    }

    if (event.key === 'Backspace' && textValue.length === 0) {
      event.preventDefault()
      await onDelete(block.id, index)
      return
    }

    if (event.key !== 'Enter' || event.shiftKey) return

    if (block.type === 'divider' || block.type === 'image') {
      event.preventDefault()
      const created = await onCreate(block.id, index)
      if (created?.id) setFocusBlockId(created.id)
      return
    }

    if (block.type === 'code') return

    event.preventDefault()
    const cursor = event.currentTarget.selectionStart ?? textValue.length
    const beforeText = textValue.slice(0, cursor)
    const afterText = textValue.slice(cursor)

    const created = await onSplit(
      block.id,
      buildContent(block.type, block.content, beforeText),
      buildContent(block.type, block.content, afterText),
    )

    if (created?.id) setFocusBlockId(created.id)
  }

  const renderReadOnly = () => {
    switch (block.type) {
      case 'heading_1':
        return <h2 className="text-4xl font-bold leading-tight text-black dark:text-white">{textValue}</h2>
      case 'heading_2':
        return <h3 className="text-2xl font-semibold leading-tight text-black dark:text-white">{textValue}</h3>
      case 'code':
        return (
          <div className="relative">
            <pre className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-6 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
              <code>{textValue}</code>
            </pre>
            {textValue && (
              <button
                type="button"
                onClick={copyToClipboard}
                className="absolute right-3 top-3 rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                title="Copy code"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            )}
          </div>
        )
      case 'image':
        return textValue ? (
          <img
            src={textValue}
            alt=""
            className="max-h-112 w-full rounded-2xl border border-gray-200 object-cover dark:border-gray-800"
          />
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No image URL provided.</p>
        )
      case 'to_do':
        return (
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mt-1 h-4 w-4 rounded border-gray-300 text-black dark:border-gray-700"
            />
            <span className={`whitespace-pre-wrap text-base leading-7 ${checked ? 'text-gray-400 line-through dark:text-gray-500' : 'text-black dark:text-white'}`}>
              {textValue}
            </span>
          </label>
        )
      case 'divider':
        return <hr className="border-0 border-t border-gray-200 dark:border-gray-800" />
      default:
        return <p className="whitespace-pre-wrap text-base leading-7 text-black dark:text-white">{textValue}</p>
    }
  }

  const renderEditable = () => {
    let inputElement

    if (block.type === 'divider') {
      inputElement = <hr className="border-0 border-t border-gray-200 dark:border-gray-800" />
    } else if (block.type === 'image') {
      inputElement = (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="url"
            value={displayValue}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={getBlockPlaceholder(block.type)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black dark:border-gray-800 dark:bg-black dark:text-white dark:focus:border-white"
          />

          {textValue ? (
            <img
              src={textValue}
              alt=""
              className="max-h-112 w-full rounded-2xl border border-gray-200 object-cover dark:border-gray-800"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
              Paste an image URL to preview it here.
            </div>
          )}
        </div>
      )
    } else if (block.type === 'to_do') {
      inputElement = (
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              const base = isRecord(block.content) ? block.content : {}
              onUpdate(block.id, { ...base, text: textValue, checked: event.target.checked })
            }}
            className="mt-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-black dark:border-gray-700 dark:bg-black dark:focus:ring-white"
          />

          <textarea
            ref={inputRef}
            rows={1}
            value={displayValue}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={getBlockPlaceholder(block.type)}
            className={getTextClassName(block.type, checked)}
          />
        </label>
      )
    } else {
      inputElement = (
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={1}
            value={displayValue}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={getBlockPlaceholder(block.type)}
            className={getTextClassName(block.type, checked)}
          />
          {block.type === 'code' && textValue && (
            <button
              type="button"
              onClick={copyToClipboard}
              className="absolute right-3 top-3 rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Copy code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="relative">
        {inputElement}
        {commandMenuOpen && (
          <div className="absolute top-full left-0 z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-black">
            {matchingBlockTypes.length > 0 ? (
              matchingBlockTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    void handleTypeSelection(type.value)
                  }}
                  className="w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="block font-medium text-black dark:text-white">{type.label}</span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500">/{type.value}</span>
                </button>
              ))
            ) : (
              <p className="px-2 py-1 text-sm text-gray-400 dark:text-gray-500">No matching block type.</p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`block-wrapper group flex gap-4 ${isDragging ? 'opacity-50' : ''}`}
      draggable={!readOnly}
      onDragStart={(event) => {
        setIsDragging(true)
        event.dataTransfer.setData('text/plain', index.toString())
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(event) => {
        event.preventDefault()
        const rect = event.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const isAbove = event.clientY < midY
        event.currentTarget.classList.toggle('drop-above', isAbove)
        event.currentTarget.classList.toggle('drop-below', !isAbove)
      }}
      onDragLeave={(event) => {
        event.currentTarget.classList.remove('drop-above', 'drop-below')
      }}
      onDrop={(event) => {
        event.preventDefault()
        event.currentTarget.classList.remove('drop-above', 'drop-below')
        const draggedIndex = parseInt(event.dataTransfer.getData('text/plain'))
        if (draggedIndex === index) return
        const rect = event.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const isAbove = event.clientY < midY
        const targetIndex = isAbove ? index : index + 1
        if (onMove) {
          onMove(draggedIndex, targetIndex)
        }
      }}
    >
      <div className="block-drag-handle hidden pt-2 text-[11px] font-medium text-gray-300 dark:text-gray-600 sm:block">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="flex-1">
        {!readOnly && (
          <div className="mb-2 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <select
              value={block.type}
              onChange={(event) => {
                void handleTypeSelection(event.target.value)
              }}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 outline-none transition-colors hover:border-gray-300 focus:border-black dark:border-gray-800 dark:bg-black dark:text-gray-300 dark:hover:border-gray-700 dark:focus:border-white"
            >
              {BLOCK_TYPES.map((typeOption) => (
                <option key={typeOption.value} value={typeOption.value}>
                  {typeOption.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onCreate(block.id, index)}
              className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700 dark:hover:border-gray-800 dark:hover:bg-gray-900 dark:hover:text-gray-200"
            >
              Add below
            </button>
          </div>
        )}

        {readOnly ? renderReadOnly() : renderEditable()}
      </div>
    </div>
  )
}

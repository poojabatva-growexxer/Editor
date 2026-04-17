import { useEffect, useRef, useState } from 'react'
import { getBlockPlaceholder } from '../../utils/helpers.js'

const BLOCK_TYPES = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading_1', label: 'Heading 1' },
  { value: 'heading_2', label: 'Heading 2' },
  { value: 'code', label: 'Code' },
  { value: 'image', label: 'Image' },
  { value: 'to_do', label: 'To-do' },
  { value: 'divider', label: 'Divider' },
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

  useEffect(() => {
    if (readOnly || focusBlockId !== block.id || !inputRef.current) return

    inputRef.current.focus()

    if (typeof inputRef.current.setSelectionRange === 'function') {
      const end = inputRef.current.value.length
      inputRef.current.setSelectionRange(end, end)
    }

    setFocusBlockId(null)
  }, [block.id, focusBlockId, readOnly, setFocusBlockId, textValue.length])

  useEffect(() => {
    if (block.type === 'divider' || block.type === 'image' || readOnly) return
    resizeTextarea(inputRef.current)
  }, [block.type, readOnly, textValue])

  const handleChange = (nextText) => {
    if (nextText.startsWith('/')) {
      setCommandMenuOpen(true)
      setCommandQuery(nextText.slice(1))
    } else {
      setCommandMenuOpen(false)
      onUpdate(block.id, buildContent(block.type, block.content, nextText))
    }
  }

  const handleKeyDown = async (event) => {
    if (readOnly) return

    if (commandMenuOpen) {
      if (event.key === 'Escape') {
        setCommandMenuOpen(false)
        setCommandQuery('')
        onUpdate(block.id, buildContent(block.type, block.content, ''))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const filtered = BLOCK_TYPES.filter(type => 
          type.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
          type.value.includes(commandQuery.toLowerCase())
        )
        if (filtered.length > 0) {
          const selected = filtered[0]
          onChangeType(block.id, selected.value)
          setCommandMenuOpen(false)
          setCommandQuery('')
          onUpdate(block.id, buildContent(selected.value, block.content, ''))
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
          <pre className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-6 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <code>{textValue}</code>
          </pre>
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
            value={textValue}
            onChange={(event) => handleChange(event.target.value)}
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
            value={commandMenuOpen ? '/' + commandQuery : commandMenuOpen ? '/' + commandQuery : textValue}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getBlockPlaceholder(block.type)}
            className={getTextClassName(block.type, checked)}
          />
        </label>
      )
    } else {
      inputElement = (
        <textarea
          ref={inputRef}
          rows={1}
          value={textValue}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getBlockPlaceholder(block.type)}
          className={getTextClassName(block.type, checked)}
        />
      )
    }

    return (
      <div className="relative">
        {inputElement}
        {commandMenuOpen && (
          <div className="absolute top-full left-0 z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-black">
            {BLOCK_TYPES.filter(type => 
              type.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
              type.value.includes(commandQuery.toLowerCase())
            ).map(type => (
              <button
                key={type.value}
                onClick={() => {
                  onChangeType(block.id, type.value)
                  setCommandMenuOpen(false)
                  setCommandQuery('')
                  // Clear the text
                  onUpdate(block.id, buildContent(type.value, block.content, ''))
                }}
                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`block-wrapper group flex gap-4 ${isDragging ? 'opacity-50' : ''}`}
      draggable={!readOnly}
      onDragStart={(e) => {
        setIsDragging(true)
        e.dataTransfer.setData('text/plain', index.toString())
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => {
        e.preventDefault()
        const rect = e.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const isAbove = e.clientY < midY
        e.currentTarget.classList.toggle('drop-above', isAbove)
        e.currentTarget.classList.toggle('drop-below', !isAbove)
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('drop-above', 'drop-below')
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.currentTarget.classList.remove('drop-above', 'drop-below')
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
        if (draggedIndex === index) return
        const rect = e.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const isAbove = e.clientY < midY
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
              onChange={(event) => onChangeType(block.id, event.target.value)}
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

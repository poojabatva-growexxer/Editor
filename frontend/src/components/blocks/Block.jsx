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

const TEXT_TOOL_TYPES = new Set(['paragraph', 'heading_1', 'heading_2'])
const TEXT_ALIGNMENTS = ['left', 'center', 'right']
const HIGHLIGHT_COLOR = '#fef08a'

// Build an array of character-level format objects from a spans array
function buildCharFormats(text, spans) {
  const formats = Array.from({ length: text.length }, () => ({}))
  if (!Array.isArray(spans)) return formats
  for (const span of spans) {
    const s = Math.max(0, span.start)
    const e = Math.min(text.length, span.end)
    for (let i = s; i < e; i++) {
      if (span.bold !== undefined) formats[i].bold = span.bold
      if (span.italic !== undefined) formats[i].italic = span.italic
      if (span.underline !== undefined) formats[i].underline = span.underline
      if (span.highlight !== undefined) formats[i].highlight = span.highlight
    }
  }
  return formats
}

// Collapse adjacent chars with identical formatting into runs
function buildRuns(text, spans) {
  if (!text) return [{ text: '', bold: false, italic: false, underline: false, highlight: false }]
  const charFmts = buildCharFormats(text, spans)
  const runs = []
  let cur = null
  for (let i = 0; i < text.length; i++) {
    const f = charFmts[i]
    if (
      !cur ||
      Boolean(f.bold) !== cur.bold ||
      Boolean(f.italic) !== cur.italic ||
      Boolean(f.underline) !== cur.underline ||
      Boolean(f.highlight) !== cur.highlight
    ) {
      cur = { text: '', bold: Boolean(f.bold), italic: Boolean(f.italic), underline: Boolean(f.underline), highlight: Boolean(f.highlight) }
      runs.push(cur)
    }
    cur.text += text[i]
  }
  return runs
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function canMergeBlocks(type1, type2) {
  return type1 === type2
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
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

function getTextFormatting(type, content) {
  const base = isRecord(content) ? content : {}
  const defaultBold = type === 'heading_1' || type === 'heading_2'
  const align = TEXT_ALIGNMENTS.includes(base.align) ? base.align : 'left'

  return {
    bold: typeof base.bold === 'boolean' ? base.bold : defaultBold,
    italic: Boolean(base.italic),
    underline: Boolean(base.underline),
    align,
    highlightColor: base.highlightColor === 'yellow' ? 'yellow' : null,
  }
}

function getTextStyle(type, content) {
  const formatting = getTextFormatting(type, content)

  return {
    fontWeight: formatting.bold ? (type === 'heading_2' ? 600 : 700) : 400,
    fontStyle: formatting.italic ? 'italic' : 'normal',
    textDecoration: formatting.underline ? 'underline' : 'none',
    textAlign: formatting.align,
    backgroundColor: formatting.highlightColor === 'yellow' ? HIGHLIGHT_COLOR : undefined,
    color: formatting.highlightColor === 'yellow' ? '#111827' : undefined,
  }
}

function getImageWidth(content) {
  const width = Number(isRecord(content) ? content.width : NaN)
  return Number.isFinite(width) ? clamp(width, 25, 100) : 100
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
      return `${common} text-4xl leading-tight`
    case 'heading_2':
      return `${common} text-2xl leading-tight`
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

function ToolbarButton({ title, active = false, disabled = false, className = '', onClick, children }) {
  const baseClassName = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors'
  const activeClassName = active
    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-800 dark:bg-black dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200'
  const disabledClassName = disabled ? 'cursor-not-allowed opacity-40' : ''

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`${baseClassName} ${activeClassName} ${disabledClassName} ${className}`}
    >
      {children}
    </button>
  )
}

function AlignIcon({ align }) {
  const positions = align === 'center' ? ['center', 'center', 'center'] : align === 'right' ? ['end', 'end', 'end'] : ['start', 'start', 'start']

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1={positions[0] === 'start' ? 2 : positions[0] === 'center' ? 4 : 6} y1="4" x2={positions[0] === 'start' ? 14 : positions[0] === 'center' ? 12 : 14} y2="4" />
      <line x1={positions[1] === 'start' ? 2 : positions[1] === 'center' ? 3 : 7} y1="8" x2={positions[1] === 'start' ? 11 : positions[1] === 'center' ? 13 : 14} y2="8" />
      <line x1={positions[2] === 'start' ? 2 : positions[2] === 'center' ? 5 : 9} y1="12" x2={positions[2] === 'start' ? 13 : positions[2] === 'center' ? 11 : 14} y2="12" />
    </svg>
  )
}

function HighlighterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.5 9.8 4.2a1.4 1.4 0 0 1 2 0l.9.9a1.4 1.4 0 0 1 0 2l-6.3 6.3H3.5v-2.9Z" />
      <path d="M2.5 13.5h11" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v12" />
      <path d="m7 12 5 5 5-5" />
    </svg>
  )
}

function ResizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 10h8" />
      <path d="M6 6l4 4" />
      <path d="M8.5 10H10V8.5" />
    </svg>
  )
}

function getCompletedTodoTargetIndex(allBlocks, index) {
  let lastUncheckedIndex = null

  for (let offset = index + 1; offset < allBlocks.length; offset += 1) {
    const candidate = allBlocks[offset]
    if (candidate?.type !== 'to_do') break
    if (!getChecked(candidate.content)) lastUncheckedIndex = offset
  }

  return lastUncheckedIndex
}

export function Block({
  block,
  index,
  previousBlock,
  allBlocks = [],
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
  const imageRef = useRef(null)
  const imageResizeRailRef = useRef(null)
  const resizeCleanupRef = useRef(null)
  const pendingCursorRef = useRef(null)
  const selectionRef = useRef({ start: 0, end: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [resizingWidth, setResizingWidth] = useState(null)

  const textValue = getTextValue(block.type, block.content)
  const checked = getChecked(block.content)
  const formatting = getTextFormatting(block.type, block.content)
  const imageWidth = getImageWidth(block.content)
  const isEmptyBlock = textValue.trim().length === 0
  const displayValue = commandMenuOpen ? `/${commandQuery}` : textValue
  const matchingBlockTypes = getMatchingBlockTypes(commandQuery)
  const completedTodoTargetIndex = block.type === 'to_do' && checked ? getCompletedTodoTargetIndex(allBlocks, index) : null

  useEffect(() => {
    if (readOnly || focusBlockId !== block.id || !inputRef.current) return

    inputRef.current.focus()

    if (typeof inputRef.current.setSelectionRange === 'function') {
      if (pendingCursorRef.current && pendingCursorRef.current.blockId === block.id) {
        const position = pendingCursorRef.current.position
        inputRef.current.setSelectionRange(position, position)
        pendingCursorRef.current = null
      } else {
        const end = inputRef.current.value.length
        inputRef.current.setSelectionRange(end, end)
      }
    }

    setFocusBlockId(null)
  }, [block.id, focusBlockId, readOnly, setFocusBlockId])

  useEffect(() => {
    if (block.type === 'divider' || block.type === 'image' || readOnly) return
    resizeTextarea(inputRef.current)
  }, [block.type, displayValue, readOnly])

  useEffect(() => () => {
    if (resizeCleanupRef.current) resizeCleanupRef.current()
  }, [])

  const closeCommandMenu = () => {
    setCommandMenuOpen(false)
    setCommandQuery('')
  }

  const handleInputBlur = () => {
    if (commandMenuOpen) closeCommandMenu()
  }

  const updateCurrentBlock = (nextContent) => {
    onUpdate(block.id, nextContent)
  }

  const updateCurrentBlockPatch = (patch) => {
    updateCurrentBlock({
      ...buildContent(block.type, block.content, textValue),
      ...patch,
    })
  }

  const handleChange = (nextText) => {
    if (isEmptyBlock && nextText.startsWith('/')) {
      setCommandMenuOpen(true)
      setCommandQuery(nextText.slice(1))
      return
    }

    closeCommandMenu()
    updateCurrentBlock(buildContent(block.type, block.content, nextText))
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textValue)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleTypeSelection = async (nextType, fromCommandMenu = false) => {
    closeCommandMenu()

    // Only create a new block when triggered from the command menu with an empty block
    if (fromCommandMenu && isEmptyBlock) {
      const created = await onCreate(block.id, index, nextType)
      if (created?.id) setFocusBlockId(created.id)
      return
    }

    // Otherwise always convert the current block in-place
    await onChangeType(block.id, nextType)
  }

  // Track textarea selection so tools can apply to selected range only
  const handleSelectionChange = () => {
    if (inputRef.current) {
      selectionRef.current = {
        start: inputRef.current.selectionStart ?? 0,
        end: inputRef.current.selectionEnd ?? 0,
      }
    }
  }

  // Apply an inline formatting toggle to the selected text range only.
  // We store range-based spans in content.spans: [{ start, end, bold?, italic?, underline?, highlight? }]
  const applyRangeFormat = (key, value) => {
    const { start, end } = selectionRef.current
    if (start === end) {
      // No selection — toggle whole-block formatting as before
      updateCurrentBlockPatch({ [key]: !formatting[key] })
      return
    }
    const base = isRecord(block.content) ? block.content : {}
    const spans = Array.isArray(base.spans) ? [...base.spans] : []
    // Remove any existing span that exactly covers this range for the same key
    const existing = spans.find((s) => s.start === start && s.end === end)
    if (existing) {
      existing[key] = !existing[key]
    } else {
      spans.push({ start, end, [key]: value })
    }
    updateCurrentBlockPatch({ spans })
  }

  const toggleTextOption = (key) => {
    const { start, end } = selectionRef.current
    if (start !== end && inputRef.current) {
      applyRangeFormat(key, !formatting[key])
    } else {
      updateCurrentBlockPatch({ [key]: !formatting[key] })
    }
  }

  const setTextAlignment = (align) => {
    updateCurrentBlockPatch({ align })
  }

  const toggleHighlight = () => {
    const { start, end } = selectionRef.current
    if (start !== end && inputRef.current) {
      applyRangeFormat('highlight', formatting.highlightColor !== 'yellow')
    } else {
      updateCurrentBlockPatch({
        highlightColor: formatting.highlightColor === 'yellow' ? undefined : 'yellow',
      })
    }
  }

  const setImageWidth = (width) => {
    const clamped = Math.round(clamp(width, 25, 100))
    updateCurrentBlockPatch({ width: clamped })
    return clamped
  }

  const startImageResize = (event) => {
    if (readOnly || !imageResizeRailRef.current) return

    event.preventDefault()
    event.stopPropagation()

    // Use the rail (full available width) as the reference for percentage calc
    const railBounds = imageResizeRailRef.current.getBoundingClientRect()
    // Snapshot the image left edge so we resize from image origin
    const imgLeft = railBounds.left

    const handlePointerMove = (moveEvent) => {
      const rawWidth = ((moveEvent.clientX - imgLeft) / railBounds.width) * 100
      const clamped = Math.round(clamp(rawWidth, 25, 100))
      setResizingWidth(clamped)
    }

    const cleanup = () => {
      // Commit the final width on pointer up
      setResizingWidth((prev) => {
        if (prev !== null) setImageWidth(prev)
        return null
      })
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', cleanup)
      resizeCleanupRef.current = null
    }

    if (resizeCleanupRef.current) resizeCleanupRef.current()
    resizeCleanupRef.current = cleanup

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', cleanup)
  }

  const moveCompletedDown = () => {
    if (completedTodoTargetIndex === null || !onMove) return
    onMove(index, completedTodoTargetIndex)
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

      updateCurrentBlock(buildContent(block.type, block.content, nextText))

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
          await handleTypeSelection(matchingBlockTypes[0].value, true)
        }
        return
      }
    }

    if (event.key === 'Backspace' && textValue.length === 0) {
      event.preventDefault()
      await onDelete(block.id, index)
      return
    }

    if (
      event.key === 'Backspace' &&
      event.currentTarget.selectionStart === 0 &&
      textValue.length > 0 &&
      previousBlock &&
      canMergeBlocks(block.type, previousBlock.type)
    ) {
      event.preventDefault()

      const previousText = getTextValue(previousBlock.type, previousBlock.content)
      const mergedText = previousText + textValue

      onUpdate(previousBlock.id, buildContent(previousBlock.type, previousBlock.content, mergedText))
      pendingCursorRef.current = { blockId: previousBlock.id, position: previousText.length }

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

    // code: let Enter insert a newline naturally
    if (block.type === 'code') return

    // to_do: Enter creates a new to_do block below (Notion-style)
    if (block.type === 'to_do') {
      event.preventDefault()
      const cursor = event.currentTarget.selectionStart ?? textValue.length
      const beforeText = textValue.slice(0, cursor)
      const afterText = textValue.slice(cursor)
      // Update current block with text before cursor
      updateCurrentBlock(buildContent(block.type, block.content, beforeText))
      // Create new to_do block with text after cursor
      const created = await onSplit(
        block.id,
        buildContent(block.type, block.content, beforeText),
        buildContent('to_do', { text: '', checked: false }, afterText),
      )
      if (created?.id) {
        pendingCursorRef.current = { blockId: created.id, position: 0 }
        setFocusBlockId(created.id)
      }
      return
    }

    event.preventDefault()
    const cursor = event.currentTarget.selectionStart ?? textValue.length
    const beforeText = textValue.slice(0, cursor)
    const afterText = textValue.slice(cursor).trimStart()

    const created = await onSplit(
      block.id,
      buildContent(block.type, block.content, beforeText),
      buildContent(block.type, block.content, afterText),
    )

    if (created?.id) {
      pendingCursorRef.current = { blockId: created.id, position: 0 }
      setFocusBlockId(created.id)
    }
  }

  const renderToolbarTools = () => {
    if (TEXT_TOOL_TYPES.has(block.type)) {
      return (
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 shadow-sm dark:border-gray-800 dark:bg-black/90">
          <ToolbarButton title="Bold" active={formatting.bold} onClick={() => toggleTextOption('bold')}>
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton title="Italic" active={formatting.italic} onClick={() => toggleTextOption('italic')}>
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton title="Underline" active={formatting.underline} onClick={() => toggleTextOption('underline')}>
            <span className="underline underline-offset-2">U</span>
          </ToolbarButton>
          <ToolbarButton
            title="Yellow highlight"
            active={formatting.highlightColor === 'yellow'}
            className={formatting.highlightColor === 'yellow' ? '!border-yellow-400 !bg-yellow-300 !text-yellow-950' : ''}
            onClick={toggleHighlight}
          >
            <HighlighterIcon />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
          {TEXT_ALIGNMENTS.map((align) => (
            <ToolbarButton
              key={align}
              title={`Align ${align}`}
              active={formatting.align === align}
              onClick={() => setTextAlignment(align)}
            >
              <AlignIcon align={align} />
            </ToolbarButton>
          ))}
        </div>
      )
    }

    if (block.type === 'to_do') {
      return (
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 shadow-sm dark:border-gray-800 dark:bg-black/90">
          <ToolbarButton
            title="Move completed down"
            disabled={completedTodoTargetIndex === null}
            onClick={moveCompletedDown}
          >
            <ArrowDownIcon />
          </ToolbarButton>
        </div>
      )
    }

    if (block.type === 'image') {
      const displayWidth = resizingWidth !== null ? resizingWidth : imageWidth
      return (
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 shadow-sm dark:border-gray-800 dark:bg-black/90">
          <span className="px-1 text-xs text-gray-400 dark:text-gray-500">Drag corner to resize &bull; {displayWidth}%</span>
        </div>
      )
    }

    return null
  }

  const renderReadOnly = () => {
    const textStyle = getTextStyle(block.type, block.content)

    switch (block.type) {
      case 'heading_1':
        return <h2 style={textStyle} className="text-4xl leading-tight text-black dark:text-white">{textValue}</h2>
      case 'heading_2':
        return <h3 style={textStyle} className="text-2xl leading-tight text-black dark:text-white">{textValue}</h3>
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
          <div className="w-full">
            <div style={{ width: `${imageWidth}%` }}>
              <img
                src={textValue}
                alt=""
                className="max-h-112 w-full rounded-2xl border border-gray-200 object-cover dark:border-gray-800"
              />
            </div>
          </div>
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
        return <p style={textStyle} className="whitespace-pre-wrap text-base leading-7 text-black dark:text-white">{textValue}</p>
    }
  }

  const renderEditable = () => {
    const textStyle = TEXT_TOOL_TYPES.has(block.type) ? getTextStyle(block.type, block.content) : undefined
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
            <div ref={imageResizeRailRef} className="relative w-full select-none">
              <div style={{ width: `${resizingWidth !== null ? resizingWidth : imageWidth}%` }} className="relative">
                <img
                  ref={imageRef}
                  src={textValue}
                  alt=""
                  className="max-h-112 w-full rounded-2xl border border-gray-200 object-cover dark:border-gray-800"
                  draggable={false}
                />
                {/* Live width tooltip while dragging */}
                {resizingWidth !== null && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white pointer-events-none">
                    {resizingWidth}%
                  </div>
                )}
                <button
                  type="button"
                  title="Drag to resize image"
                  onPointerDown={startImageResize}
                  className="absolute bottom-3 right-3 inline-flex h-8 w-8 cursor-ew-resize items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-500 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-black/90 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
                >
                  <ResizeIcon />
                </button>
              </div>
            </div>
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
              updateCurrentBlock({ ...base, text: textValue, checked: event.target.checked })
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
            onSelect={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            placeholder={getBlockPlaceholder(block.type)}
            className={getTextClassName(block.type, checked)}
          />
        </label>
      )
    } else {
      // For text block types that support rich formatting, render a rich overlay
      // The textarea handles input; a positioned overlay renders formatted spans.
      const hasSpans = TEXT_TOOL_TYPES.has(block.type) && Array.isArray(block.content?.spans) && block.content.spans.length > 0
      const runs = hasSpans ? buildRuns(textValue, block.content.spans) : null

      inputElement = (
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={1}
            value={displayValue}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            placeholder={getBlockPlaceholder(block.type)}
            className={`${getTextClassName(block.type, checked)} ${hasSpans ? 'caret-black dark:caret-white text-transparent dark:text-transparent selection:bg-blue-200 dark:selection:bg-blue-800' : ''}`}
            style={textStyle}
          />
          {/* Rich-text overlay — visible only when spans exist; sits above the transparent textarea text */}
          {hasSpans && runs && (
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 whitespace-pre-wrap break-words ${getTextClassName(block.type, checked)}`}
              style={{ ...textStyle, color: undefined, backgroundColor: undefined }}
            >
              {runs.map((run, i) => (
                <span
                  key={i}
                  style={{
                    fontWeight: run.bold ? (block.type === 'heading_2' ? 600 : 700) : (textStyle?.fontWeight ?? 400),
                    fontStyle: run.italic ? 'italic' : (textStyle?.fontStyle ?? 'normal'),
                    textDecoration: run.underline ? 'underline' : 'none',
                    backgroundColor: run.highlight ? HIGHLIGHT_COLOR : 'transparent',
                    color: run.highlight ? '#111827' : 'inherit',
                  }}
                >
                  {run.text}
                </span>
              ))}
            </div>
          )}
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
        if (onMove) onMove(draggedIndex, targetIndex)
      }}
    >
      <div className="block-drag-handle hidden pt-2 text-[11px] font-medium text-gray-300 dark:text-gray-600 sm:block">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="flex-1">
        {!readOnly && (
          <div className="mb-2 flex flex-wrap items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 shadow-sm dark:border-gray-800 dark:bg-black/90">
              <select
                value={block.type}
                onChange={(event) => {
                  // fromCommandMenu=false → always convert in-place, never create a new block
                  void handleTypeSelection(event.target.value, false)
                }}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 outline-none transition-colors hover:border-gray-300 focus:border-black dark:border-gray-800 dark:bg-black dark:text-gray-300 dark:hover:border-gray-700 dark:focus:border-white"
              >
                {BLOCK_TYPES.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </option>
                ))}
              </select>

              <ToolbarButton title="Add below" onClick={() => onCreate(block.id, index)}>
                <AddIcon />
              </ToolbarButton>
            </div>

            {renderToolbarTools()}

            <div className="ml-auto flex items-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 shadow-sm dark:border-gray-800 dark:bg-black/90">
              <ToolbarButton title="Delete block" onClick={() => onDelete(block.id, index)}>
                <TrashIcon />
              </ToolbarButton>
            </div>
          </div>
        )}

        {readOnly ? renderReadOnly() : renderEditable()}
      </div>
    </div>
  )
}

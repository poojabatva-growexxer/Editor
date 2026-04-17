import { useEffect, useRef, useState } from 'react'
import { Block } from '../blocks/index.js'
import { Button } from '../ui/Button.jsx'

const DEFAULT_CONTENT = {
  paragraph: { text: '' },
  heading_1: { text: '' },
  heading_2: { text: '' },
  code: { text: '' },
  image: { url: '' },
  to_do: { text: '', checked: false },
  divider: {},
}

function getDefaultContent(type = 'paragraph') {
  const template = DEFAULT_CONTENT[type] ?? DEFAULT_CONTENT.paragraph
  return { ...template }
}

function getInsertOrderIndex(blocks, index) {
  if (index < 0 || !blocks[index]) return 1

  const current = blocks[index]
  const next = blocks[index + 1]

  if (!next) return (current.orderIndex ?? index + 1) + 1

  return ((current.orderIndex ?? index + 1) + (next.orderIndex ?? index + 2)) / 2
}

export function BlockEditor({
  initialTitle = 'Untitled',
  onTitleChange,
  blocks,
  loading,
  updateBlockLocal,
  createBlock,
  deleteBlock,
  splitBlock,
  changeBlockType,
  moveBlock,
  reorderBlocks,
  saveTitle,
}) {
  const [title, setTitle] = useState(initialTitle || 'Untitled')
  const [focusBlockId, setFocusBlockId] = useState(null)
  const [titleBusy, setTitleBusy] = useState(false)

  const hasSeededBlockRef = useRef(false)
  const committedTitleRef = useRef(initialTitle || 'Untitled')
  const savingTitleRef = useRef(false)

  useEffect(() => {
    const nextTitle = initialTitle || 'Untitled'
    setTitle(nextTitle)
    committedTitleRef.current = nextTitle
  }, [initialTitle])

  useEffect(() => {
    if (loading || hasSeededBlockRef.current || blocks.length > 0) return

    hasSeededBlockRef.current = true

    createBlock('paragraph', getDefaultContent('paragraph'), 1)
      .then((newBlock) => {
        if (newBlock?.id) setFocusBlockId(newBlock.id)
      })
      .catch(() => {
        hasSeededBlockRef.current = false
      })
  }, [blocks.length, createBlock, loading])

  const commitTitle = async () => {
    if (savingTitleRef.current) return

    const nextTitle = title.trim() || 'Untitled'
    setTitle(nextTitle)

    if (nextTitle === committedTitleRef.current) return

    const previousTitle = committedTitleRef.current
    savingTitleRef.current = true
    setTitleBusy(true)

    try {
      await saveTitle(nextTitle)
      committedTitleRef.current = nextTitle
      onTitleChange?.(nextTitle)
    } catch {
      setTitle(previousTitle)
      onTitleChange?.(previousTitle)
    } finally {
      savingTitleRef.current = false
      setTitleBusy(false)
    }
  }

  const handleCreateAfter = async (_blockId, index, type = 'paragraph') => {
    const newBlock = await createBlock(type, getDefaultContent(type), getInsertOrderIndex(blocks, index))
    if (newBlock?.id) setFocusBlockId(newBlock.id)
    return newBlock
  }

  const handleDelete = async (blockId, index) => {
    const fallbackId = blocks[index - 1]?.id ?? blocks[index + 1]?.id ?? null
    await deleteBlock(blockId)
    if (fallbackId) setFocusBlockId(fallbackId)
  }

  const handleSplit = async (blockId, beforeContent, afterContent) => {
    const created = await splitBlock(blockId, beforeContent, afterContent)
    if (created?.id) setFocusBlockId(created.id)
    return created
  }

  const handleChangeType = async (blockId, type) => {
    await changeBlockType(blockId, type)
    if (type !== 'divider') setFocusBlockId(blockId)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-12 w-2/3 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="mt-8 space-y-5">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-900" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-10">
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
          }}
          onBlur={commitTitle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'NumpadEnter') {
              event.preventDefault()
              void commitTitle()
              event.currentTarget.blur()
            }
          }}
          placeholder="Untitled"
          className="w-full bg-transparent text-5xl font-bold tracking-tight text-black outline-none dark:text-white"
        />

        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {titleBusy ? 'Saving title...' : 'Press Enter to save the title and use the block controls below to shape the page.'}
        </p>
      </div>

      {blocks.length > 0 ? (
        <div className="space-y-5">
          {blocks.map((block, index) => (
            <Block
              key={block.id}
              block={block}
              index={index}
              previousBlock={blocks[index - 1]}
              allBlocks={blocks}
              focusBlockId={focusBlockId}
              setFocusBlockId={setFocusBlockId}
              onUpdate={updateBlockLocal}
              onCreate={handleCreateAfter}
              onDelete={handleDelete}
              onSplit={handleSplit}
              onChangeType={handleChangeType}
              onMove={moveBlock}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">This document is empty.</p>
          <Button className="mt-4" onClick={() => handleCreateAfter(null, -1)}>
            Add the first block
          </Button>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="mt-8">
          <Button variant="outline" onClick={() => handleCreateAfter(blocks.at(-1)?.id ?? null, blocks.length - 1)}>
            Add block
          </Button>
        </div>
      )}
    </div>
  )
}

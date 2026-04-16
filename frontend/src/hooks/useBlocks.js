import { useState, useEffect, useCallback, useRef } from 'react'
import { blockService } from '../services/block.service.js'
import { documentService } from '../services/document.service.js'

export const SAVE_STATUS = { IDLE: 'idle', SAVING: 'saving', SAVED: 'saved', ERROR: 'error' }

export function useBlocks(documentId) {
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE)

  const pendingRef = useRef({}) // blockId -> {content, timer}
  const latestRef  = useRef({}) // blockId -> timestamp of last local update

  const extractBlocks = useCallback((res) => {
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.data?.blocks)) return res.data.blocks
    return []
  }, [])

  // ── Fetch blocks ────────────────────────────────
  useEffect(() => {
    if (!documentId) {
      setBlocks([])
      setLoading(false)
      return
    }

    setLoading(true)
    blockService.list(documentId)
      .then(res => setBlocks(extractBlocks(res)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [documentId, extractBlocks])

  useEffect(() => () => {
    Object.values(pendingRef.current).forEach((pending) => {
      if (pending?.timer) clearTimeout(pending.timer)
    })
  }, [])

  // ── Auto-save helper ────────────────────────────
  const scheduleSave = useCallback((blockId, content) => {
    setSaveStatus(SAVE_STATUS.SAVING)
    const ts = Date.now()
    latestRef.current[blockId] = ts

    if (pendingRef.current[blockId]?.timer) {
      clearTimeout(pendingRef.current[blockId].timer)
    }

    pendingRef.current[blockId] = {
      timer: setTimeout(async () => {
        // Stale-write guard
        if (latestRef.current[blockId] !== ts) return
        try {
          await blockService.update(documentId, blockId, { content })
          setSaveStatus(SAVE_STATUS.SAVED)
          setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 2000)
        } catch {
          setSaveStatus(SAVE_STATUS.ERROR)
        }
      }, 1000),
    }
  }, [documentId])

  // ── Local update (optimistic) ───────────────────
  const updateBlockLocal = useCallback((blockId, content) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b))
    scheduleSave(blockId, content)
  }, [scheduleSave])

  // ── Create block ────────────────────────────────
  const createBlock = useCallback(async (type = 'paragraph', content = { text: '' }, orderIndex) => {
    const maxOrder = blocks.length ? Math.max(...blocks.map(b => b.orderIndex)) : 0
    const res = await blockService.create(documentId, {
      type,
      content,
      orderIndex: orderIndex ?? maxOrder + 1,
    })
    const newBlock = res.data.block ?? res.data
    setBlocks(prev => {
      const next = [...prev, newBlock]
      return next.sort((a, b) => a.orderIndex - b.orderIndex)
    })
    return newBlock
  }, [documentId, blocks])

  // ── Delete block ────────────────────────────────
  const deleteBlock = useCallback(async (blockId) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId))
    try {
      await blockService.delete(documentId, blockId)
    } catch {
      // Refetch on failure
      blockService.list(documentId).then(res => setBlocks(extractBlocks(res)))
    }
  }, [documentId, extractBlocks])

  // ── Split block ─────────────────────────────────
  const splitBlock = useCallback(async (blockId, beforeContent, afterContent) => {
    const res = await blockService.split(documentId, blockId, beforeContent, afterContent)
    const { original, created } = res.data
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? original : b)
      next.push(created)
      return next.sort((a, b) => a.orderIndex - b.orderIndex)
    })
    return created
  }, [documentId])

  // ── Change block type ───────────────────────────
  const changeBlockType = useCallback(async (blockId, type) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, type } : b))
    await blockService.update(documentId, blockId, { type })
  }, [documentId])

  // ── Move block (for drag and drop) ─────────────
  const moveBlock = useCallback(async (fromIndex, toIndex) => {
    setBlocks(prev => {
      const newBlocks = [...prev]
      const [moved] = newBlocks.splice(fromIndex, 1)
      newBlocks.splice(toIndex, 0, moved)
      // Persist the move
      const moves = newBlocks.map((b, i) =>
        blockService.move(documentId, b.id, i + 1)
      )
      Promise.all(moves).catch(console.error)
      return newBlocks
    })
  }, [documentId])

  // ── Reorder (after drag) ────────────────────────
  const reorderBlocks = useCallback(async (newBlocks) => {
    setBlocks(newBlocks)
    // Persist each moved block by its new 1-based position
    const moves = newBlocks.map((b, i) =>
      blockService.move(documentId, b.id, i + 1)
    )
    await Promise.all(moves).catch(console.error)
  }, [documentId])

  // ── Rename document title ───────────────────────
  const saveTitle = useCallback(async (title) => {
    setSaveStatus(SAVE_STATUS.SAVING)
    try {
      await documentService.update(documentId, { title })
      setSaveStatus(SAVE_STATUS.SAVED)
      setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 2000)
    } catch (error) {
      setSaveStatus(SAVE_STATUS.ERROR)
      throw error
    }
  }, [documentId])

  return {
    blocks,
    loading,
    saveStatus,
    updateBlockLocal,
    createBlock,
    deleteBlock,
    splitBlock,
    changeBlockType,
    moveBlock,
    reorderBlocks,
    saveTitle,
  }
}

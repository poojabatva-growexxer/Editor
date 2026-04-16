import { useState, useEffect, useCallback } from 'react'
import { documentService } from '../services/document.service.js'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await documentService.list()
      setDocuments(res.data.documents)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = useCallback(async (title) => {
    const res = await documentService.create(title)
    const doc = res.data.document ?? res.data
    setDocuments(prev => [doc, ...prev])
    return doc
  }, [])

  const rename = useCallback(async (id, title) => {
    const res = await documentService.update(id, { title })
    const updated = res.data.document ?? res.data
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    await documentService.delete(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }, [])

  return { documents, loading, error, create, rename, remove, refetch: fetchAll }
}

import { api } from './api.js'

export const blockService = {
  list: (documentId) =>
    api.get(`/documents/${documentId}/blocks`),

  create: (documentId, data) =>
    api.post(`/documents/${documentId}/blocks`, data),

  update: (documentId, blockId, data) =>
    api.patch(`/documents/${documentId}/blocks/${blockId}`, data),

  delete: (documentId, blockId) =>
    api.delete(`/documents/${documentId}/blocks/${blockId}`),

  split: (documentId, blockId, beforeContent, afterContent) =>
    api.post(`/documents/${documentId}/blocks/${blockId}/split`, {
      beforeContent,
      afterContent,
    }),

  move: (documentId, blockId, newPosition, newParentId = null) =>
    api.patch(`/documents/${documentId}/blocks/${blockId}/move`, {
      newPosition,
      newParentId,
    }),
}
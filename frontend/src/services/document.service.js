import { api } from './api.js'

export const documentService = {
  list: () =>
    api.get('/documents'),

  create: (title = 'Untitled') =>
    api.post('/documents', { title }),

  update: (id, data) =>
    api.patch(`/documents/${id}`, data),

  delete: (id) =>
    api.delete(`/documents/${id}`),

  share: (id, isPublic) =>
    api.patch(`/documents/${id}/share`, { isPublic }),

  getPublic: (token) =>
    api.get(`/share/${token}`),
}

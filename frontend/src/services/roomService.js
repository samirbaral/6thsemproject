import api from './api.js';

export const roomService = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (formData) => {
    return api.post('/rooms', formData);
  },
  update: (id, formData) => {
    return api.put(`/rooms/${id}`, formData);
  },
  delete: (id) => api.delete(`/rooms/${id}`),
};


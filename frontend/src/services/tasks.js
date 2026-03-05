import api from './api'

export const tasksService = {
  async getTasks(params = {}) {
    const { data } = await api.get('/tasks/', { params })
    return data
  },
  async getTask(id) {
    const { data } = await api.get(`/tasks/${id}/`)
    return data
  },
  async createTask(payload) {
    const { data } = await api.post('/tasks/', payload)
    return data
  },
  async updateTask(id, payload) {
    const { data } = await api.patch(`/tasks/${id}/`, payload)
    return data
  },
  async deleteTask(id) {
    const { data } = await api.delete(`/tasks/${id}/`)
    return data
  },
  async completeTask(id) {
    const { data } = await api.post(`/tasks/${id}/complete/`)
    return data
  },
  async archiveTask(id) {
    const { data } = await api.post(`/tasks/${id}/archive/`)
    return data
  },
  async createFeedback(payload) {
    const { data } = await api.post('/feedback/', payload)
    return data
  },
  async getFeedbacks(params = {}) {
    const { data } = await api.get('/feedback/list/', { params })
    return data
  },
}

import api from './api'

export const adminService = {
  async getUsers(params = {}) {
    const { data } = await api.get('/admin/users/', { params })
    return data
  },
  async updateUser(id, payload) {
    const { data } = await api.patch(`/admin/users/${id}/`, payload)
    return data
  },
  async getTasks(params = {}) {
    const { data } = await api.get('/admin/tasks/', { params })
    return data
  },
  async getAnalytics() {
    const { data } = await api.get('/admin/analytics/')
    return data
  },
}

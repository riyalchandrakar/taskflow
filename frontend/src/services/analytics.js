import api from './api'

export const analyticsService = {
  async getDashboard() {
    const { data } = await api.get('/analytics/')
    return data
  },

  async getTasksOverTime(period = 'day') {
    const { data } = await api.get('/analytics/over-time/', { params: { period } })
    return data
  },

  async getProductivityScore() {
    const { data } = await api.get('/analytics/productivity/')
    return data
  },
}

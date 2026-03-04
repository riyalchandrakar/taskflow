import api from './api'

export const authService = {
  async register(name, email, password, confirmPassword) {
    const { data } = await api.post('/auth/register/', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
    })
    return data
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password })
    return data
  },

  async logout(refreshToken) {
    const { data } = await api.post('/auth/logout/', { refresh: refreshToken })
    return data
  },

  async getMe() {
    const { data } = await api.get('/auth/me/')
    return data
  },
}

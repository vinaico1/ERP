import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pdv_token')
    if (token) {
      authAPI.me()
        .then(({ data }) => setUser(data.data))
        .catch(() => {
          localStorage.removeItem('pdv_token')
          localStorage.removeItem('pdv_refresh')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const { data } = await authAPI.login(email, password)
    localStorage.setItem('pdv_token', data.data.token)
    localStorage.setItem('pdv_refresh', data.data.refreshToken)
    setUser(data.data.user)
    return data.data.user
  }

  async function logout() {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('pdv_token')
    localStorage.removeItem('pdv_refresh')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

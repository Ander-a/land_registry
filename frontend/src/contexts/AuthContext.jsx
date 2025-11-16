import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const navigate = useNavigate()
  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem('token')
    const user = token ? JSON.parse(localStorage.getItem('user') || 'null') : null
    return { user, token }
  })

  const login = ({ user, token }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuthState({ user, token })
    navigate('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuthState({ user: null, token: null })
    navigate('/login')
  }

  const isAuthenticated = () => !!authState.token

  return (
    <AuthContext.Provider value={{ authState, setAuthState, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { setAuthState } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try{
      const res = await api.login({ email, password })
      const token = res.data.access_token
      const user = res.data.user
      localStorage.setItem('token', token)
      setAuthState({ user, token })
      navigate('/dashboard')
    }catch(err){
      setError(err?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  )
}

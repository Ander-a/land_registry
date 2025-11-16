import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard(){
  const { authState } = useAuth()
  const [me, setMe] = useState(null)

  useEffect(() => {
    async function fetchMe(){
      try{
        const res = await api.getMe()
        setMe(res.data)
      }catch(e){
        console.error(e)
      }
    }
    fetchMe()
  }, [])

  return (
    <div>
      <h2>Dashboard</h2>
      <div>Welcome, {authState?.user?.name || 'User'}</div>
      <pre>{me ? JSON.stringify(me, null, 2) : 'Loading...'}</pre>
    </div>
  )
}

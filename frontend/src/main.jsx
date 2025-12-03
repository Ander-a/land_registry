import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { JurisdictionProvider } from './contexts/JurisdictionContext'

import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <JurisdictionProvider>
          <App />
        </JurisdictionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

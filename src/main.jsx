import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { WalletProvider } from './context/WalletContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CampusDataProvider } from './context/CampusDataContext.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <WalletProvider>
        <AuthProvider>
          <CampusDataProvider>
            <App />
          </CampusDataProvider>
        </AuthProvider>
      </WalletProvider>
    </HashRouter>
  </React.StrictMode>,
)

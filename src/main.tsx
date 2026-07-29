import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { Lock } from './components/Lock'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Lock>
      <HashRouter>
        <App />
      </HashRouter>
    </Lock>
  </React.StrictMode>,
)

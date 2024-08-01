import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ThreeRoot from './components/threeroot.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ThreeRoot/>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </>
)

import React from 'react'
import { createRoot } from 'react-dom/client'
const stylesheet = document.createElement('link')
stylesheet.rel = 'stylesheet'
stylesheet.href = new URL('./styles.css', import.meta.url).href
document.head.appendChild(stylesheet)
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
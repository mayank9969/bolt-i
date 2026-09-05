import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-400-italic.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-600-italic.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QuizProvider } from './context/QuizContext'
import App from './App'
import './styles/globals.css'
import { initTheme } from './lib/theme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QuizProvider>
        <App />
      </QuizProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

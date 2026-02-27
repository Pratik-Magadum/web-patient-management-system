import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles.css'

console.log('🚀 Initializing React application...')
console.log('📍 Current URL:', window.location.href)
console.log('🏥 Hostname:', window.location.hostname)

// Initialize MSW (Mock Service Worker) for API mocking
async function initializeApp() {
  try {
    // Try to start MSW for API mocking (development)
    if (import.meta.env.DEV) {
      try {
        const { startMSW } = await import('./worker')
        const mswStarted = await startMSW()
        if (!mswStarted) {
          console.log('ℹ️  MSW not started, using regular fetch (connect to real API or use fallback)')
        }
      } catch (error) {
        console.warn('⚠️  MSW setup skipped:', error.message)
      }
    }

    // Mount React application
    const rootElement = document.getElementById('root')
    if (!rootElement) {
      throw new Error('Root element not found! Make sure index.html has <div id="root"></div>')
    }

    const root = createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    )
    console.log('✅ React application mounted')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          padding: 40px;
          background: #fee;
          color: #c33;
          fontFamily: monospace;
          fontSize: 14px;
          lineHeight: 1.6;
        ">
          <h1>❌ Application Error</h1>
          <p>Failed to initialize: ${error.message}</p>
          <p>Check browser console (F12) for details</p>
        </div>
      `
    }
  }
}

// Start the application
initializeApp()

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './AppModern.tsx'
import { QueryProvider } from './app/providers/QueryProvider'
import { antdTheme } from './theme'
import { initSentry } from './config/sentry'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'

// Initialize Sentry monitoring
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <ConfigProvider theme={antdTheme}>
          <App />
        </ConfigProvider>
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

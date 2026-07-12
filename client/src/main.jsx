import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clerk is optional. If VITE_CLERK_PUBLISHABLE_KEY is not set in .env,
// the app runs using the built-in JWT authentication system only.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

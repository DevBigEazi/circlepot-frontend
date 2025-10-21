import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'
import { ThirdwebProvider } from 'thirdweb/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <ThirdwebProvider>
          <BrowserRouter>
              <App />
          </BrowserRouter>
      </ThirdwebProvider>
  </StrictMode>
)

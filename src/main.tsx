import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './contexts/CartContext'
import { PinningProvider } from './contexts/PinningContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <PinningProvider>
        <App />
      </PinningProvider>
    </CartProvider>
  </StrictMode>,
)

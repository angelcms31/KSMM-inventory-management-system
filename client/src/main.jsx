import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom';
import { SocketProvider } from "./context/SocketContext";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <SocketProvider>
        <App />
      </SocketProvider>
    </HashRouter>
  </StrictMode>
)
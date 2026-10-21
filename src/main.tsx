import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Web3Provider } from './lib/web3/Web3Provider';
import { MultiChainWeb3Provider } from './contexts/MultiChainWeb3Context';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <BrowserRouter>
        <AuthProvider>
          <MultiChainWeb3Provider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </MultiChainWeb3Provider>
        </AuthProvider>
      </BrowserRouter>
    </Web3Provider>
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { ThemeCodeProvider } from './context/ThemeCodeContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeCodeProvider>
        <App />
      </ThemeCodeProvider>
    </AuthProvider>
  </StrictMode>
);

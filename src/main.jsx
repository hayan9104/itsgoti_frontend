import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthProvider } from './context/AuthContext';
import { ThemeCodeProvider } from './context/ThemeCodeContext';
import './index.css';
import App from './App.jsx';

// Register GSAP plugins once at app startup
gsap.registerPlugin(ScrollTrigger);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeCodeProvider>
        <App />
      </ThemeCodeProvider>
    </AuthProvider>
  </StrictMode>
);

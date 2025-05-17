import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './index.css';
import './App.css';
import './FullDarkMode.css';
import './Responsive.css';
import './components/components.css';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { suppressConsoleErrors } from './utils/suppressConsole';

// Start suppressing console errors
suppressConsoleErrors();

// Initialize dark mode immediately, before React renders
document.documentElement.classList.add('dark-mode');
document.body.classList.add('dark-mode');
document.documentElement.setAttribute('data-bs-theme', 'dark');

// Vite way of rendering the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
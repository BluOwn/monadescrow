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
import './components/ImprovedUX.css';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import AppErrorBoundary from './components/ErrorBoundary';
import { suppressConsoleErrors } from './utils/suppressConsole';

// Only suppress console errors in production
if (import.meta.env.PROD) {
  suppressConsoleErrors();
} else {
  console.log('🔧 Development mode: Console errors are visible');
}

// Initialize dark mode immediately, before React renders
document.documentElement.classList.add('dark-mode');
document.body.classList.add('dark-mode');
document.documentElement.setAttribute('data-bs-theme', 'dark');

// Vite way of rendering the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import './FullDarkMode.css';
import './Responsive.css';
import './components/components.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './contexts/ThemeContext';
import { suppressConsoleErrors } from './utils/suppressConsole';

// Start suppressing console errors
suppressConsoleErrors();

// Initialize dark mode immediately, before React renders
document.documentElement.classList.add('dark-mode');
document.body.classList.add('dark-mode');
document.documentElement.setAttribute('data-bs-theme', 'dark');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
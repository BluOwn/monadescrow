// src/components/DarkModeWrapper.js
// Create this file with the following content:

import React, { useContext, useEffect } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const DarkModeWrapper = ({ children }) => {
  const { darkMode } = useContext(ThemeContext);
  
  useEffect(() => {
    // Force dark mode on component mount
    const applyDarkMode = () => {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    };
    
    // Apply dark mode immediately and after a short delay to ensure it takes effect
    if (darkMode) {
      applyDarkMode();
      
      // Sometimes the class gets removed by other scripts, so reapply after a delay
      const timeoutId = setTimeout(applyDarkMode, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [darkMode]);

  return (
    <div className={`app-wrapper ${darkMode ? 'dark-mode' : ''}`} 
         style={{ 
           minHeight: '100vh',
           backgroundColor: darkMode ? '#121212' : 'inherit',
           color: darkMode ? '#e1e1e1' : 'inherit'
         }}>
      {children}
    </div>
  );
};

export default DarkModeWrapper;
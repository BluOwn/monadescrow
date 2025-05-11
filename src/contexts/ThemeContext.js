// src/contexts/ThemeContext.js
// Create this file with the following content:

import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  darkMode: true, // Default to dark mode
  toggleDarkMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Initialize with dark mode by default
  const [darkMode, setDarkMode] = useState(true);

  // Update document attributes when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
    // Save preference to localStorage
    localStorage.setItem('monad-escrow-dark-mode', String(darkMode));
  }, [darkMode]);

  // Initial setup
  useEffect(() => {
    // Force dark mode on first load
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
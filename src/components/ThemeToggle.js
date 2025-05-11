// src/components/ThemeToggle.js
// Create this file with the following content:

import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { ThemeContext } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <Button 
      variant={darkMode ? "outline-light" : "outline-dark"} 
      size="sm"
      onClick={toggleDarkMode}
      className="ms-2"
    >
      {darkMode ? "Light Mode" : "Dark Mode"}
    </Button>
  );
};

export default ThemeToggle;
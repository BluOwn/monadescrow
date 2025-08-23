import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { ThemeContext } from '../contexts/ThemeContext';

export const EnhancedThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={toggleDarkMode}
      className="theme-toggle-btn d-flex align-items-center gap-2"
    >
      <span className="theme-icon">
        {darkMode ? '☀️' : '🌙'}
      </span>
      <span className="d-none d-md-inline">
        {darkMode ? 'Light' : 'Dark'}
      </span>
    </Button>
  );
};
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = "" }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl glass-panel hover:bg-emerald-500/10 transition-all duration-300 flex items-center justify-center ${className}`}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-700" />
            ) : (
                <Sun className="w-5 h-5 text-emerald-400" />
            )}
        </button>
    );
};

export default ThemeToggle;

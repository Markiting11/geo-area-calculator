
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
    return (
        <button
            className={`flex items-center justify-center px-6 py-3 border border-transparent rounded-full shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

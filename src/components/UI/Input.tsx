import React, { forwardRef } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, iconPosition = 'left', helperText, className = '', ...props }, ref) => {
    const hasError = !!error;
    
    const inputClassName = `
      w-full px-3 py-2 border rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
      ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
      ${hasError 
        ? 'border-red-300 focus:ring-red-500' 
        : 'border-gray-300 hover:border-gray-400'
      }
      ${className}
    `;

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Icon className={`h-5 w-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClassName}
            {...props}
          />
          
          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Icon className={`h-5 w-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
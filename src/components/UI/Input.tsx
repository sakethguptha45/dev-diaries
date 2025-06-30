import React, { forwardRef } from 'react';

import { DivideIcon as LucideIcon } from 'lucide-react';



interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;

  iconPosition?: 'left' | 'right';
  helperText?: string;
  required?: boolean;

}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon: Icon,

  iconPosition = 'left',
  helperText,
  required,
  className = '',
  ...props
}, ref) => {
  const hasError = !!error;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}

        </label>
      )}
      
      <div className="relative">

        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>

        )}
        
        <input
          ref={ref}
          className={`

            w-full py-3 border rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:border-transparent
            ${Icon && iconPosition === 'left' ? 'pl-10' : 'pl-4'}
            ${Icon && iconPosition === 'right' ? 'pr-10' : 'pr-4'}
            ${hasError 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'

            }
            ${className}
          `}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>

      )}
    </div>
  );
});

Input.displayName = 'Input';
import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, icon: Icon, className, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.toString().length > 0;

    return (
      <div className={`relative ${className}`}>
        <div className={`
          relative flex items-center bg-slate-900/50 border rounded-xl overflow-hidden transition-all duration-300
          ${isFocused ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-700 hover:border-slate-600'}
        `}>
          {Icon && (
            <div className={`pl-4 transition-colors duration-300 ${isFocused ? 'text-primary-400' : 'text-slate-500'}`}>
              <Icon size={20} />
            </div>
          )}
          
          <div className="relative flex-1 h-14">
            <input
              ref={ref}
              {...props}
              value={value}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              className="absolute inset-0 w-full h-full bg-transparent px-4 text-white placeholder-transparent focus:outline-none z-10"
              placeholder={label}
            />
            <label
              className={`
                absolute left-4 transition-all duration-200 pointer-events-none z-0
                ${(isFocused || hasValue) 
                  ? 'top-2 text-xs text-primary-400' 
                  : 'top-4 text-slate-400'}
              `}
            >
              {label}
            </label>
          </div>
        </div>
      </div>
    );
  }
);

export default FloatingLabelInput;

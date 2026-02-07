import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    className = '',
    label,
    error,
    leftIcon,
    rightElement,
    id,
    ...props
}, ref) => {
    const inputId = id || props.name;

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={inputId} className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full bg-black/20 border border-white/5 rounded-xl
            px-4 py-3 text-sm text-white placeholder-slate-600
            transition-all duration-200
            focus:outline-none focus:border-primary-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-primary-500/10
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-11' : ''}
            ${error ? 'border-rose-500/50 focus:border-rose-500' : ''}
            ${className}
          `}
                    {...props}
                />

                {rightElement && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-rose-400 ml-1 font-medium animate-pulse">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

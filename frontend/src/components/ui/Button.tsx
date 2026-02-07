import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

const VARIANTS = {
    primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 border-transparent',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white border-transparent',
    danger: 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20 border-transparent',
    ghost: 'hover:bg-white/5 text-slate-400 hover:text-white border-transparent',
    glass: 'glass border-white/5 text-slate-300 hover:text-white hover:bg-white/5',
};

const SIZES = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-11 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading,
    leftIcon,
    children,
    disabled,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={`
        relative overflow-hidden transition-all duration-200 
        flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide
        border active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {!isLoading && leftIcon}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

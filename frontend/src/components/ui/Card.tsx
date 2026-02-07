import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
    className = '',
    noPadding = false,
    children,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={`
        bg-surface/50 backdrop-blur-xl border border-white/5 rounded-2xl
        shadow-2xl shadow-black/20
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

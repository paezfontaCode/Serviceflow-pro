import { ReactNode } from 'react';

interface POSLayoutProps {
    children: ReactNode;
    header?: ReactNode;
}

export const POSLayout = ({ children, header }: POSLayoutProps) => {
    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in">
            {header && (
                <header className="flex-none">
                    {header}
                </header>
            )}
            <main className="flex-1 min-h-0 flex gap-4">
                {children}
            </main>
        </div>
    );
};

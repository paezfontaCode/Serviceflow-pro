import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Search, ScanBarcode } from 'lucide-react';

interface OmniSearchProps {
    onSearch: (query: string) => void;
    onBarcodeScanned?: (code: string) => void;
    placeholder?: string;
}

export default function OmniSearch({
    onSearch,
    placeholder = "Buscar producto o escanear código..."
}: OmniSearchProps) {
    const [value, setValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Basic heuristic: if it looks like a barcode (only numbers, > 8 chars) or starts with #
            // Actually, let the parent decide, but we can trigger specific callbacks if needed.
            // For now, just pass the query effectively.

            // If onBarcodeScanned is provided and it looks like a barcode (e.g. pure numbers, length > 4??)
            // Let's stick to a simpler logic: The parent handles the string logic.
            onSearch(value);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        onSearch(newValue); // Real-time search for typing
    };

    return (
        <div className="relative group min-w-[300px] max-w-[500px] flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors">
                <Search size={18} />
            </div>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full h-12 bg-black/20 border border-white/5 rounded-xl pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:border-primary-500/50 focus:bg-black/40 focus:shadow-lg focus:shadow-primary-500/10 transition-all outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                <ScanBarcode size={18} />
            </div>
        </div>
    );
}

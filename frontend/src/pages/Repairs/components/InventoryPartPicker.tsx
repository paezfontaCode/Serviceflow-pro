import { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/api/inventoryService';
import { ProductRead } from '@/types/api';

interface InventoryPartPickerProps {
    onSelectPart: (product: ProductRead) => void;
    initialSearch?: string;
}

// Simple debounce hook implementation inside the component to avoid external dependencies if not present
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function InventoryPartPicker({ onSelectPart, initialSearch = '' }: InventoryPartPickerProps) {
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Update search if initialSearch changes (e.g. from quick action)
    useEffect(() => {
        if (initialSearch) {
            setSearchTerm(initialSearch);
            // Focus the input to streamline selection
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [initialSearch]);
    
    const debouncedSearch = useDebounce(searchTerm, 300); // 300ms debounce as requested

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'], 
        queryFn: inventoryService.getProducts,
        // In a real optimized scenario, we would pass the search term to the API
        // For now, we filter client-side as per existing service structure
    });

    const filteredProducts = products?.filter(p => {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                              p.sku?.toLowerCase().includes(searchLower);
        const hasStock = p.inventory_quantity > 0;
        return matchesSearch && hasStock;
    }).slice(0, 10); // Limit results for performance

    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Buscar repuesto (Pantalla, Batería...)" 
                    className="input-field h-10 pl-10 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                         <Loader2 className="animate-spin text-primary-400" size={16} />
                    </div>
                )}
            </div>

            {debouncedSearch && (
                <div className="glass-card border-white/10 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredProducts?.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">
                            No se encontraron repuestos con stock
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredProducts?.map(product => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectPart(product);
                                        setSearchTerm(''); // Clear search after selection
                                    }}
                                    className="w-full p-2 flex items-center justify-between hover:bg-white/5 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-primary-400 transition-colors">
                                            <Package size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{product.name}</p>
                                            <p className="text-[10px] text-slate-500">
                                                Stock: <span className="text-emerald-400">{product.inventory_quantity}</span> • SKU: {product.sku || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-2">
                                        <span className="text-xs font-black text-white bg-white/5 px-2 py-1 rounded">
                                            ${product.price_usd}
                                        </span>
                                        <Plus size={14} className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

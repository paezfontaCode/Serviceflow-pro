import { useState, useMemo } from 'react';
import {
    Plus,
    Trash2,
    Search,
    Calendar,
    Package,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { purchaseService } from '@/services/api/purchaseService';
import { inventoryService } from '@/services/api/inventoryService';
import { PurchaseOrderCreate, ProductRead, PurchaseItemCreate } from '@/types/api';
import { PurchaseOrderSchema } from '@/lib/schemas';
import { formatUSD } from '@/utils/currency';
import { toast } from 'sonner';

interface PurchaseOrderFormProps {
    onClose: () => void;
}

export default function PurchaseOrderForm({ onClose }: PurchaseOrderFormProps) {
    const queryClient = useQueryClient();

    // State
    const [supplierId, setSupplierId] = useState<string>('');
    const [items, setItems] = useState<PurchaseItemCreate[]>([]);
    const [notes, setNotes] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Queries
    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => purchaseService.getSuppliers()
    });

    const { data: productsPagination } = useQuery({
        queryKey: ['inventory', productSearch],
        queryFn: () => inventoryService.getProducts(1, 10, productSearch)
    });

    const products = productsPagination?.items || [];

    // Mutations
    const mutation = useMutation({
        mutationFn: (data: PurchaseOrderCreate) => purchaseService.createPurchase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast.success('Orden de compra creada');
            onClose();
        },
        onError: () => {
            toast.error('Error al crear la orden');
        }
    });

    // Derived
    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        return products.slice(0, 5);
    }, [products, productSearch]);

    const total = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_cost_usd), 0);
    }, [items]);

    // Handlers
    const addItem = (product: ProductRead) => {
        const existing = items.find(i => i.product_id === product.id);
        if (existing) {
            toast.warning('El producto ya está en la lista');
            return;
        }

        setItems([...items, {
            product_id: product.id,
            quantity: 1,
            unit_cost_usd: product.cost_usd
        }]);
        setProductSearch('');
    };

    const removeItem = (productId: number) => {
        setItems(items.filter(i => i.product_id !== productId));
    };

    const updateItem = (productId: number, field: 'quantity' | 'unit_cost_usd', value: number) => {
        setItems(items.map(i => i.product_id === productId ? { ...i, [field]: value } : i));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const data: PurchaseOrderCreate = {
            supplier_id: parseInt(supplierId),
            notes,
            expected_date: expectedDate || undefined,
            items
        };

        const result = PurchaseOrderSchema.safeParse(data);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path.join('.');
                errors[path] = issue.message;
            });
            setFieldErrors(errors);
            toast.error('Corrige los errores en la orden');
            return;
        }

        mutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative glass-card w-full max-w-4xl p-8 border-white/10 animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            <Package size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nueva Orden de Compra</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Supplier */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Proveedor</label>
                            <select
                                className="input-field h-12"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                            >
                                <option value="">Seleccionar Proveedor...</option>
                                {suppliers?.items?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {fieldErrors.supplier_id && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.supplier_id}</p>}
                        </div>

                        {/* Expected Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha Esperada</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="date"
                                    className="input-field pl-10 h-12"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product Search */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Productos a Ordenar</label>
                            <span className="text-xs font-bold text-primary-400">{items.length} items agregados</span>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar productos por nombre o SKU..."
                                className="input-field pl-12 h-12"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                            />

                            {filteredProducts.length > 0 && (
                                <div className="absolute z-20 w-full mt-2 glass-card border-white/10 rounded-xl overflow-hidden shadow-2xl">
                                    {filteredProducts.map(product => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => addItem(product)}
                                            className="w-full p-4 text-left hover:bg-white/5 border-b border-white/5 flex items-center justify-between group/item"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover/item:text-primary-400 transition-colors">{product.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{product.sku} | Costo Sug: {formatUSD(product.cost_usd)}</p>
                                            </div>
                                            <Plus size={18} className="text-slate-600 group-hover/item:text-primary-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="p-4">Producto</th>
                                        <th className="p-4 text-center w-24">Cant.</th>
                                        <th className="p-4 text-right w-40">Costo Unit ($)</th>
                                        <th className="p-4 text-right w-40">Subtotal</th>
                                        <th className="p-4 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-600 italic text-sm">
                                                No has agregado productos a la orden
                                            </td>
                                        </tr>
                                    ) : items.map((item) => {
                                        const product = products.find(p => p.id === item.product_id);
                                        return (
                                            <tr key={item.product_id} className="text-sm">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-200">{product?.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono uppercase">{product?.sku}</p>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-16 h-8 bg-white/5 border border-white/10 rounded text-center text-white focus:outline-none focus:border-primary-500/50"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.product_id, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-slate-500">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-24 h-8 bg-white/5 border border-white/10 rounded text-right pr-2 text-white focus:outline-none focus:border-primary-500/50"
                                                            value={item.unit_cost_usd}
                                                            onChange={(e) => updateItem(item.product_id, 'unit_cost_usd', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-white">
                                                    {formatUSD(item.quantity * item.unit_cost_usd)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.product_id)}
                                                        className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-white/5">
                                        <td colSpan={3} className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimado:</td>
                                        <td className="p-4 text-right text-lg font-black text-primary-400">{formatUSD(total)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {fieldErrors.items && <p className="text-[10px] text-rose-500 font-bold px-1 text-center">{fieldErrors.items}</p>}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Notas / Observaciones</label>
                        <textarea
                            className="input-field p-4 min-h-[80px] resize-none"
                            placeholder="Detalles sobre el envío, condiciones de pago, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || items.length === 0}
                            className="flex-[2] btn-primary h-14 flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            <div className="flex flex-col items-start leading-tight">
                                <span className="font-black uppercase tracking-widest text-xs">Crear Orden de Compra</span>
                                <span className="text-[10px] font-bold text-white/50">Estado: Borrador (Draft)</span>
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

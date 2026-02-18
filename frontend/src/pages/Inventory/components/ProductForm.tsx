import { useState, useEffect } from 'react';
import { X, Save, Package, Tag, DollarSign, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/api/inventoryService';
import { ProductRead } from '@/types/api';
import { toast } from 'sonner';
import { ProductSchema } from '@/lib/schemas';

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    product?: ProductRead;
}

export default function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
    const queryClient = useQueryClient();
    const isEdit = !!product;

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price_usd: '',
        cost_usd: '',
        category_id: '',
        brand: '',
        model: '',
        inventory_quantity: '',
        is_active: true
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: inventoryService.getCategories
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku || '',
                price_usd: product.price_usd.toString(),
                cost_usd: product.cost_usd.toString(),
                category_id: product.category_id?.toString() || '',
                brand: product.brand || '',
                model: product.model || '',
                inventory_quantity: product.inventory_quantity.toString(),
                is_active: product.is_active
            });
        } else {
            setFormData({
                name: '',
                sku: '',
                price_usd: '',
                cost_usd: '',
                category_id: '',
                brand: '',
                model: '',
                inventory_quantity: '0',
                is_active: true
            });
        }
    }, [product, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: any) => isEdit
            ? inventoryService.updateProduct(product!.id, data)
            : inventoryService.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(isEdit ? 'Producto actualizado' : 'Producto creado exitosamente');
            onClose();
        },
        onError: (error: any) => {
            toast.error('Error al guardar producto', {
                description: error.response?.data?.detail?.[0]?.msg || 'Verifica los datos'
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const validationData = {
            ...formData,
            price_usd: parseFloat(formData.price_usd),
            cost_usd: parseFloat(formData.cost_usd),
            category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
            min_stock: parseInt(formData.inventory_quantity) // Using initial stock as min stock placeholder or adjust
        };

        const result = ProductSchema.safeParse(validationData);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string;
                errors[path] = issue.message;
            });
            setFieldErrors(errors);
            toast.error('Corrige los errores en el formulario');
            return;
        }

        mutation.mutate({
            ...result.data,
            inventory_quantity: parseInt(formData.inventory_quantity), // Schema doesn't have inventory_quantity, it's computed or initial
            is_active: formData.is_active
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative glass-card w-full max-w-2xl overflow-hidden border-white/10 animate-fade-in-up">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                            <Package size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Información General</label>
                            <input
                                type="text"
                                placeholder="Nombre del producto"
                                required
                                className="input-field h-12"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            {fieldErrors.name && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.name}</p>}
                        </div>

                        {/* Inventory & Category */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Clasificación</label>
                            <input
                                type="text"
                                placeholder="SKU / Código Barra"
                                className="input-field h-12"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                            <select
                                className="input-field h-12 appearance-none cursor-pointer"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">Sin Categoría</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {(fieldErrors.sku || fieldErrors.category_id) && (
                                <div className="space-y-1">
                                    {fieldErrors.sku && <p className="text-[10px] text-rose-500 font-bold px-1">SKU: {fieldErrors.sku}</p>}
                                    {fieldErrors.category_id && <p className="text-[10px] text-rose-500 font-bold px-1">Categoría: {fieldErrors.category_id}</p>}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Marca y Modelo</label>
                            <input
                                type="text"
                                placeholder="Marca (ej: Samsung)"
                                className="input-field h-12"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Modelo (ej: Galaxy S24)"
                                className="input-field h-12"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>

                        {/* Pricing */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Finanzas (USD)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" size={18} />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Precio Venta"
                                    required
                                    className="input-field h-12 pl-12"
                                    value={formData.price_usd}
                                    onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Costo Compra"
                                    required
                                    className="input-field h-12 pl-12"
                                    value={formData.cost_usd}
                                    onChange={(e) => setFormData({ ...formData, cost_usd: e.target.value })}
                                />
                            </div>
                            {(fieldErrors.price_usd || fieldErrors.cost_usd) && (
                                <div className="space-y-1">
                                    {fieldErrors.price_usd && <p className="text-[10px] text-rose-500 font-bold px-1">Precio: {fieldErrors.price_usd}</p>}
                                    {fieldErrors.cost_usd && <p className="text-[10px] text-rose-500 font-bold px-1">Costo: {fieldErrors.cost_usd}</p>}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Existencia</label>
                            <div className="relative group">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                                <input
                                    type="number"
                                    placeholder="Stock Inicial"
                                    required
                                    className="input-field h-12 pl-12"
                                    value={formData.inventory_quantity}
                                    onChange={(e) => setFormData({ ...formData, inventory_quantity: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 glass-card border-white/5">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-white cursor-pointer">Producto Activo</label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-[2] btn-primary h-12 group"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>{isEdit ? 'Actualizar Producto' : 'Guardar Producto'}</span>
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

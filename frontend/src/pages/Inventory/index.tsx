import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Box,
  Edit2,
  Trash2,
  Loader2,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/api/inventoryService';
import { formatUSD } from '@/utils/currency';
import { ProductRead } from '@/types/api';
import { toast } from 'sonner';
import ProductForm from './components/ProductForm';
import ImportCSVModal from './components/ImportCSVModal';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRead | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: inventoryService.getProducts,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: inventoryService.getCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar el producto');
    }
  });

  const handleExport = async () => {
    try {
        const blob = await inventoryService.exportProducts();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventario_productos.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Exportación iniciada');
    } catch (error) {
        toast.error('Error al exportar productos');
    }
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalProducts = products?.length || 0;
  const lowStock = products?.filter(p => p.inventory_quantity <= 5).length || 0;
  const outOfStock = products?.filter(p => p.inventory_quantity === 0).length || 0;
  const totalValue = products?.reduce((acc, p) => acc + (p.price_usd * (p.inventory_quantity || 0)), 0) || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Productos" 
          value={totalProducts.toString()} 
          icon={Package} 
          trend="+12% este mes"
          color="primary"
        />
        <StatCard 
          title="Valor Inventario" 
          value={formatUSD(totalValue)} 
          icon={TrendingUp} 
          trend="Basado en PVP"
          color="finance"
        />
        <StatCard 
          title="Bajo Stock" 
          value={lowStock.toString()} 
          icon={AlertTriangle} 
          trend="Requiere atención"
          color="warning"
        />
        <StatCard 
          title="Sin Stock" 
          value={outOfStock.toString()} 
          icon={Box} 
          trend="Agotados"
          color="danger"
        />
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por código, nombre..." 
              className="input-field pl-12 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="input-field h-12 min-w-[200px] appearance-none cursor-pointer"
          >
            <option value="">Todas las Categorías</option>
            {categories?.filter(cat => ['Repuestos', 'Accesorios'].includes(cat.name)).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
            <button 
                onClick={handleExport}
                className="px-4 py-3 glass rounded-xl flex items-center gap-2 text-slate-400 hover:text-white border border-white/5 hover:bg-white/5 transition-all"
                title="Exportar a CSV"
            >
                <Download size={20} />
            </button>
            <button 
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-3 glass rounded-xl flex items-center gap-2 text-slate-400 hover:text-white border border-white/5 hover:bg-white/5 transition-all"
                title="Importar desde CSV"
            >
                <FileSpreadsheet size={20} />
            </button>
            <button 
              onClick={() => {
                setSelectedProduct(undefined);
                setIsProductFormOpen(true);
              }}
              className="btn-primary px-8 h-12 flex items-center gap-2 group flex-1 lg:flex-none justify-center"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span>Nuevo Producto</span>
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card overflow-hidden border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">SKU / Modelo</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-6 py-4">Precio (USD)</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary-500" />
                    <p className="font-bold">Cargando inventario...</p>
                  </td>
                </tr>
              ) : filteredProducts?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 opacity-50">
                    <Package size={60} className="mx-auto mb-4" />
                    <p className="text-xl font-medium">No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                filteredProducts?.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{product.name}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{product.brand} {product.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-400">{product.sku || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-400 text-[10px] font-bold border border-white/5">
                        {product.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${getStockColor(product.inventory_quantity)}`}></div>
                        <span className="text-sm font-black text-white">{product.inventory_quantity}</span>
                        {product.inventory_quantity <= 5 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-tighter ml-1">
                            Bajo Stock
                          </span>
                        )}
                      </div>

                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-white">{formatUSD(product.price_usd)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsProductFormOpen(true);
                          }}
                          className="p-2 rounded-lg hover:bg-primary-500/10 text-slate-400 hover:text-primary-400 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('¿Seguro que desea eliminar este producto?')) {
                                deleteMutation.mutate(product.id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ProductForm 
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        product={selectedProduct}
      />
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
             queryClient.invalidateQueries({ queryKey: ['products'] });
             setIsImportModalOpen(false);
        }}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string, value: string, icon: any, trend: string, color: string }) {
  const colorMap: any = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20 shadow-primary-500/5',
    finance: 'text-finance bg-finance/10 border-finance/20 shadow-finance/5',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    danger: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5',
  };

  return (
    <div className={`glass-card p-6 border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon size={80} strokeWidth={1} />
      </div>
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-white">{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 opacity-60">
          <Icon size={12} className={colorMap[color].split(' ')[0]} />
          {trend}
        </p>
      </div>
    </div>
  );
}

function getStockColor(quantity: number) {
  if (quantity === 0) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
  if (quantity <= 5) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
  return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
}

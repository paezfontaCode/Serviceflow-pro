import { useState } from 'react';
import { Search, Package, Plus, Loader2, Wrench, Tag, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/api/inventoryService';
import { repairService } from '@/services/api/repairService';
import { useCartStore } from '@/store/cartStore';
import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { formatUSD, formatVES } from '@/utils/currency';
import ReadyOrdersModal from './ReadyOrdersModal';

// Removed unused SearchResultType

interface ProductResult {
  type: 'product';
  id: number;
  name: string;
  sku?: string;
  price_usd: number;
  stock: number;
  category_id: number;
  description?: string;
}

interface RepairResult {
  type: 'repair';
  id: number;
  customer_id: number;
  customer_name: string;
  brand: string;
  model: string;
  remaining_balance: number;
  status: string;
  description: string;
}

type SearchResult = ProductResult | RepairResult;

export default function ProductCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const addItem = useCartStore((state) => state.addItem);
  const addRepairItem = useCartStore((state) => state.addRepairItem);
  const exchangeRate = useExchangeRateStore((state) => state.rate);
  const [isReadyOrdersModalOpen, setIsReadyOrdersModalOpen] = useState(false);

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: inventoryService.getProducts,
  });

  // Fetch completed repairs (ready for pickup)
  const { data: repairs, isLoading: isLoadingRepairs } = useQuery({
    queryKey: ['completedRepairs'],
    queryFn: async () => {
      const allRepairs = await repairService.getWorkOrders();
      return allRepairs.filter(r => {
        const finalCost = (r.labor_cost_usd || 0) + (r.parts_cost_usd || 0);
        const paid = r.paid_amount_usd || 0;
        const remaining = finalCost - paid;
        return (r.status.toLowerCase() === 'ready' || r.status.toLowerCase() === 'completed') && remaining > 0;
      });
    },
  });

  const isLoading = isLoadingProducts || isLoadingRepairs;

  // Unified search results
  const searchResults: SearchResult[] = [];

  // Filters
  const filteredProducts = products?.filter((product) => {
    // SECURITY: Filter out 'Repuestos' category strictly.
    // The user wants to see "Accesorios" and "Servicios", but NOT spare parts like "Pantallas".
    // We assume category name check is sufficient if established in DB.
    // Also check if name indicates a spare part (fallback).
    const categoryName = product.category?.name?.toLowerCase() || '';
    const isSparePart = categoryName === 'repuestos' || categoryName === 'parts' || categoryName === 'repuesto';
    
    if (isSparePart) return false;

    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && product.is_active;
  }) || [];

  // Filter repairs (for the main grid - though we now have a modal, we keep it as fallback or remove if redundant)
  // Actually, the user wants a MODAL for "Load Ready Order". 
  // I will keep the repairs in the main grid ONLY if searched directly, but the main entry is the modal.
  const filteredRepairs = Boolean(searchTerm) ? repairs?.filter((repair) => {
    const searchLower = searchTerm.toLowerCase();
    const customerName = repair.customer_name || 'Cliente';
    const deviceModel = repair.device_model || '';
    
    return customerName.toLowerCase().includes(searchLower) ||
           deviceModel.toLowerCase().includes(searchLower) ||
           repair.id.toString().includes(searchTerm);
  }) || [] : [];

  // Combine results
  filteredProducts.forEach(p => searchResults.push({
    type: 'product',
    id: p.id,
    name: p.name,
    sku: p.sku,
    price_usd: p.price_usd,
    stock: p.inventory_quantity,
    category_id: p.category_id || 0,
    description: p.description
  }));

  filteredRepairs.forEach(r => {
    const finalCost = (r.labor_cost_usd || 0) + (r.parts_cost_usd || 0);
    const paid = r.paid_amount_usd || 0;
    const remaining = finalCost - paid;

    searchResults.push({
      type: 'repair',
      id: r.id,
      customer_id: r.customer_id,
      customer_name: r.customer_name || 'Cliente sin nombre',
      brand: '', // WorkOrderRead only has device_model string
      model: r.device_model,
      remaining_balance: remaining,
      status: r.status,
      description: r.problem_description
    });
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Omnichannel Search Bar */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar productos, servicios o # de orden..." 
            className="input-field pl-12 h-14 text-lg w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Quick Stats & Import Button */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            <span className="text-xs font-bold text-slate-400">{filteredProducts.length} Productos</span>
          </div>
          
          <button 
            onClick={() => setIsReadyOrdersModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-finance/20 hover:bg-finance/30 text-finance border border-finance/30 rounded-xl transition-all group"
          >
            <Wrench size={16} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold">{repairs?.length || 0} Órdenes Listas</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <ReadyOrdersModal 
        isOpen={isReadyOrdersModalOpen} 
        onClose={() => setIsReadyOrdersModalOpen(false)} 
      />

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
            <Package size={80} strokeWidth={1} />
            <p className="text-xl font-medium">No se encontraron resultados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {searchResults.map((result) => (
              result.type === 'product' ? (
                <ProductCard 
                  key={`product-${result.id}`}
                  product={result}
                  exchangeRate={exchangeRate}
                  onAdd={() => addItem({
                    id: result.id,
                    name: result.name,
                    sku: result.sku,
                    price_usd: result.price_usd,
                    stock: result.stock,
                    category_id: result.category_id
                  })}
                />
              ) : (
                <RepairCard 
                  key={`repair-${result.id}`}
                  repair={result}
                  exchangeRate={exchangeRate}
                  onAdd={() => addRepairItem({
                    id: result.id,
                    customer_id: result.customer_id,
                    customer_name: result.customer_name,
                    brand: result.brand,
                    model: result.model,
                    remaining_balance: result.remaining_balance,
                    description: result.description
                  })}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, exchangeRate, onAdd }: { product: ProductResult, exchangeRate: number, onAdd: () => void }) {
  return (
    <div className="glass-card group hover:border-primary-500/50 transition-all duration-300 flex flex-col overflow-hidden h-[220px] border-l-4 border-l-primary-500">
      <div className="p-5 flex-1 relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Tag size={12} className="text-primary-400" />
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">PRODUCTO</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.stock > 10 ? 'bg-success/10 text-success' : 'bg-rose-500/10 text-rose-500'}`}>
            {product.stock} en stock
          </span>
        </div>
        <h4 className="text-white font-bold text-lg leading-tight mb-1 group-hover:text-primary-400 transition-colors line-clamp-2">{product.name}</h4>
        <p className="text-[10px] text-slate-500 font-mono">{product.sku || 'SIN SKU'}</p>
        
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-white">{formatUSD(product.price_usd)}</p>
            <p className="text-xs font-bold text-finance uppercase italic tracking-tighter">≈ {formatVES(product.price_usd * exchangeRate)}</p>
          </div>
          <button 
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-glow hover:bg-primary-500 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RepairCard({ repair, exchangeRate, onAdd }: { repair: RepairResult, exchangeRate: number, onAdd: () => void }) {
  return (
    <div className="glass-card group hover:border-finance/50 transition-all duration-300 flex flex-col overflow-hidden h-[220px] border-l-4 border-l-finance bg-gradient-to-br from-finance/5 to-transparent">
      <div className="p-5 flex-1 relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Wrench size={12} className="text-finance" />
            <span className="text-[10px] font-black text-finance uppercase tracking-widest">SERVICIO</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
            LISTO
          </span>
        </div>
        <h4 className="text-white font-bold text-lg leading-tight mb-1 group-hover:text-finance transition-colors">
          {repair.brand} {repair.model}
        </h4>
        <p className="text-[10px] text-slate-500">#{repair.id.toString().padStart(5, '0')} • {repair.customer_name}</p>
        <p className="text-xs text-slate-400 line-clamp-1 mt-1">{repair.description}</p>
        
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Saldo Pendiente</p>
            <p className="text-2xl font-black text-finance">{formatUSD(repair.remaining_balance)}</p>
            <p className="text-xs font-bold text-slate-500 italic tracking-tighter">≈ {formatVES(repair.remaining_balance * exchangeRate)}</p>
          </div>
          <button 
            onClick={onAdd}
            className="w-12 h-12 bg-finance rounded-2xl flex items-center justify-center text-white shadow-low hover:bg-amber-500 hover:scale-110 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

import { Trash2, Minus, Plus, CreditCard, ShoppingCart, Package, Wrench } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { formatUSD, formatVES, formatExchangeRate } from '@/utils/currency';

interface CartPanelProps {
    onCheckout: () => void;
}

export default function CartPanel({ onCheckout }: CartPanelProps) {
    const {
        items,
        currency,
        exchangeRateSnapshot,
        removeItem,
        removeRepairItem,
        updateQuantity,
        clearCart,
        setCurrency,
        getTotalUSD,
        getTotalVES,
        getProductItems,
        getRepairItems
    } = useCartStore();

    const currentRate = useExchangeRateStore((state) => state.rate);
    const activeRate = exchangeRateSnapshot || currentRate;

    const totalUSD = getTotalUSD();
    const totalVES = getTotalVES();
    const productItems = getProductItems();
    const repairItems = getRepairItems();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                        <ShoppingCart size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Carrito ({items.length})</h3>
                </div>
                <button
                    onClick={clearCart}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                    <Trash2 size={14} />
                    Limpiar
                </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto pr-2 mb-6 custom-scrollbar space-y-3">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                        <ShoppingCart size={64} strokeWidth={1} />
                        <p className="text-sm font-medium">El carrito está vacío</p>
                    </div>
                ) : (
                    <>
                        {/* Product Items */}
                        {productItems.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={12} /> Productos
                                </p>
                                {productItems.map((item) => (
                                    <div key={`product-${item.product.id}`} className="glass-card p-3 border-white/5 flex gap-3 border-l-2 border-l-primary-500">
                                        <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                                            <Package size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{item.product.name}</p>
                                            <p className="text-[10px] text-slate-500">{formatUSD(item.product.price_usd)} c/u</p>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1 border border-white/5">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        className="p-1 rounded-md hover:bg-slate-700 text-slate-400"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-xs font-bold text-white w-6 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        className="p-1 rounded-md hover:bg-slate-700 text-slate-400"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold text-primary-400">{formatUSD(item.product.price_usd * item.quantity)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.product.id)}
                                            className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Repair Items */}
                        {repairItems.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <p className="text-[10px] font-black text-finance uppercase tracking-widest flex items-center gap-2">
                                    <Wrench size={12} /> Servicios
                                </p>
                                {repairItems.map((item) => (
                                    <div key={`repair-${item.repair.id}`} className="glass-card p-3 border-white/5 flex gap-3 border-l-2 border-l-finance bg-gradient-to-r from-finance/5 to-transparent">
                                        <div className="w-12 h-12 rounded-lg bg-finance/10 flex items-center justify-center text-finance">
                                            <Wrench size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{item.repair.brand} {item.repair.model}</p>
                                            <p className="text-[10px] text-slate-500">#{item.repair.id.toString().padStart(5, '0')} • {item.repair.customer_name}</p>

                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded">Saldo Pendiente</span>
                                                <p className="text-sm font-bold text-finance">{formatUSD(item.repair.remaining_balance)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeRepairItem(item.repair.id)}
                                            className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Summary */}
            <div className="space-y-4 pt-6 border-t border-white/5">
                {/* Currency Switcher */}
                <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5">
                    <button
                        onClick={() => setCurrency('USD')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${currency === 'USD' ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        USD ($)
                    </button>
                    <button
                        onClick={() => setCurrency('VES')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${currency === 'VES' ? 'bg-finance text-white shadow-low' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        VES (Bs.)
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-sm">Tasa Aplicada:</span>
                        <span className="text-sm font-mono text-finance">1 USD = {formatExchangeRate(activeRate)} Bs.</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Subtotal:</span>
                        <span className="text-sm font-bold text-white">{formatUSD(totalUSD)}</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-lg font-bold text-white">TOTAL:</span>
                        <div className="text-right">
                            <p className="text-3xl font-black text-primary-400 leading-none">{currency === 'USD' ? formatUSD(totalUSD) : formatVES(totalVES)}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {currency === 'USD' ? `≈ ${formatVES(totalVES)}` : `≈ ${formatUSD(totalUSD)}`}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    disabled={items.length === 0}
                    onClick={onCheckout}
                    className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed group h-16"
                >
                    <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-lg uppercase tracking-wider">Procesar Venta</span>
                </button>
            </div>
        </div>
    );
}

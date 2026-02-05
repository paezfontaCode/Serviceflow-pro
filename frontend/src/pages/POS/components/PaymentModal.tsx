import { useState, useEffect } from 'react';
import {
    X,
    CreditCard,
    DollarSign,
    Wallet,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    User,
    Search,
    AlertCircle,
    Plus
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/store/cartStore';
import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { formatUSD, formatVES } from '@/utils/currency';
import { salesService } from '@/services/api/salesService';
import { customerService } from '@/services/api/customerService';
import { SaleCreate } from '@/types/api';
import { toast } from 'sonner';
import { ticketService } from '@/services/ticketService';
import CustomerQuickModal from '@/components/CustomerQuickModal';
import WhatsAppButton from '@/components/WhatsAppButton';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
    const {
        items,
        currency,
        exchangeRateSnapshot,
        getTotalUSD,
        getTotalVES,
        getProductItems,
        getRepairItems,
        selectedCustomerId,
        setSelectedCustomer,
        clearCart
    } = useCartStore();

    const currentRate = useExchangeRateStore((state) => state.rate);
    const activeRate = exchangeRateSnapshot || currentRate;

    const totalUSD = getTotalUSD();
    const totalVES = getTotalVES();
    const productItems = getProductItems();
    const repairItems = getRepairItems();

    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'mixed'>('cash');
    const [amountPaid, setAmountPaid] = useState<string>(
        currency === 'USD' ? totalUSD.toFixed(2) : totalVES.toFixed(2)
    );
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isPartialPayment, setIsPartialPayment] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const queryClient = useQueryClient();

    // Fetch customers
    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getCustomers,
    });

    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

    // Calculate amounts
    const amountPaidNum = parseFloat(amountPaid) || 0;
    const amountPaidUSD = currency === 'USD' ? amountPaidNum : amountPaidNum / activeRate;
    const pendingDebt = Math.max(0, totalUSD - amountPaidUSD);
    const hasPendingDebt = pendingDebt > 0.01;

    // Validation
    const needsCustomer = hasPendingDebt && isPartialPayment;
    const canProcess = items.length > 0 && (!needsCustomer || selectedCustomerId !== null);

    useEffect(() => {
        setAmountPaid(currency === 'USD' ? totalUSD.toFixed(2) : totalVES.toFixed(2));
    }, [currency, totalUSD, totalVES]);

    useEffect(() => {
        setIsPartialPayment(hasPendingDebt);
    }, [hasPendingDebt]);

    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch) ||
        c.dni?.includes(customerSearch)
    ).slice(0, 5);

    const handleProcessPayment = async () => {
        if (!canProcess) {
            toast.error('Debes seleccionar un cliente para pagos parciales');
            return;
        }

        setIsProcessing(true);

        try {
            const saleData: SaleCreate & { repair_ids?: number[], amount_paid?: number } = {
                customer_id: selectedCustomerId || undefined,
                items: productItems.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity
                })),
                repair_ids: repairItems.map(item => item.repair.id),
                payment_method: paymentMethod,
                payment_currency: currency,
                amount_paid: amountPaidUSD,
                notes: notes || undefined,
            };

            const response = await salesService.createSale(saleData);

            // Notify Success
            toast.success('Venta procesada exitosamente', {
                description: hasPendingDebt
                    ? `Saldo pendiente: ${formatUSD(pendingDebt)}`
                    : `Tasa aplicada: ${activeRate} Bs.`,
                icon: <CheckCircle2 className="text-emerald-500" />
            });

            // Warranty Notification Logic
            if (repairItems.length > 0 && !hasPendingDebt) {

                const warrantyDays = 7;
                // Calculate actual warranty expiration for notification display
                // (Backend already did this, but we show it in toast)
                const expDate = new Date();
                let added = 0;
                while (added < warrantyDays) {
                    expDate.setDate(expDate.getDate() + 1);
                    if (expDate.getDay() !== 0) added++;
                }

                setTimeout(() => {
                    toast('¡Equipo Entregado!', {
                        description: (
                            <div className="flex flex-col gap-2">
                                <span>Garantía hasta {expDate.toLocaleDateString()}. ¿Enviar ticket por WhatsApp?</span>
                                <WhatsAppButton
                                    phone={selectedCustomer?.phone}
                                    customerName={selectedCustomer?.name || 'Cliente'}
                                    orderId={response.id}
                                    status="DELIVERED"
                                    device={repairItems[0]?.repair.model || 'Equipo'}
                                    balance={0}
                                    mode="direct"
                                    type="sale"
                                    className="w-full"
                                />
                            </div>
                        ),
                        icon: <div className="p-2 bg-emerald-500/20 rounded-full"><CheckCircle2 className="text-emerald-500" size={18} /></div>,
                        duration: 10000,
                    });
                }, 1000);
            } else if (selectedCustomer && selectedCustomer.phone) {
                // Regular sale without repairs
                setTimeout(() => {
                    toast('Venta Completada', {
                        description: (
                            <div className="flex flex-col gap-2">
                                <span>¿Enviar comprobante digital?</span>
                                <WhatsAppButton
                                    phone={selectedCustomer.phone}
                                    customerName={selectedCustomer.name}
                                    orderId={response.id}
                                    status="PAID"
                                    device="Productos Diversos"
                                    balance={pendingDebt}
                                    mode="direct"
                                    type="sale"
                                    className="w-full"
                                />
                            </div>
                        ),
                        duration: 8000,
                    });
                }, 500);
            }

            // Auto-print option
            const shouldPrint = window.confirm('¿Desea imprimir el ticket de venta?');
            if (shouldPrint) {
                ticketService.generateThermalTicket({
                    orderId: response.id,
                    customerName: selectedCustomer
                        ? selectedCustomer.name
                        : 'Cliente General',
                    items: productItems.map(i => ({
                        name: i.product.name,
                        quantity: i.quantity,
                        price: i.product.price_usd
                    })),
                    services: repairItems.map(i => ({
                        id: i.repair.id,
                        description: `${i.repair.brand} ${i.repair.model}`,
                        amount: i.repair.remaining_balance
                    })),
                    totalUsd: totalUSD,
                    amountPaid: amountPaidUSD,
                    pendingDebt: pendingDebt,
                    exchangeRate: activeRate,
                    paymentMethod: paymentMethod.toUpperCase(),
                    date: new Date().toISOString(),
                    entryDate: repairItems[0]?.repair.created_at,
                    warrantyExpiration: !hasPendingDebt ? new Date(new Date().setDate(new Date().getDate() + 10)).toISOString() : undefined // Fallback for display in ticket, backend handles real one
                });
            }

            clearCart();
            onClose();
        } catch (error: any) {
            console.error('Sale error:', error);
            const detail = error.response?.data?.detail || 'Error desconocido';
            toast.error('Error al procesar el pago', {
                description: Array.isArray(detail) ? detail[0].msg : detail
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative glass-card w-full max-w-5xl overflow-hidden border-white/10 animate-fade-in-up">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                            <CreditCard size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Finalizar Venta</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Summary (Left) */}
                    <div className="p-8 bg-slate-900/40 border-r border-white/5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 underline decoration-primary-500/30 underline-offset-8 decoration-2">Resumen de Cobro</h3>

                        <div className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-sm text-slate-400">Total a Pagar</p>
                                <p className="text-5xl font-black text-white">{formatUSD(totalUSD)}</p>
                                <p className="text-xl font-bold text-slate-500">≈ {formatVES(totalVES)}</p>
                            </div>

                            <div className="p-4 rounded-xl bg-finance/10 border border-finance/20 flex gap-3">
                                <AlertTriangle className="text-finance flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-xs font-bold text-finance uppercase tracking-tight">Tasa Congelada (Snapshot)</p>
                                    <p className="text-sm font-medium text-slate-300">1 USD = {activeRate} Bs.</p>
                                </div>
                            </div>

                            {/* Items Summary */}
                            <div className="space-y-3">
                                {productItems.length > 0 && (
                                    <>
                                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Productos</p>
                                        <div className="space-y-2">
                                            {productItems.map(item => (
                                                <div key={item.product.id} className="flex justify-between items-center text-sm p-3 glass-card border-white/5 border-l-2 border-l-primary-500">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold truncate max-w-[180px]">{item.product.name}</span>
                                                        <span className="text-[10px] text-slate-500">{item.quantity} un. x {formatUSD(item.product.price_usd)}</span>
                                                    </div>
                                                    <span className="text-primary-400 font-black">{formatUSD(item.product.price_usd * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {repairItems.length > 0 && (
                                    <>
                                        <p className="text-xs font-bold text-finance uppercase tracking-widest mt-4">Servicios</p>
                                        <div className="space-y-2">
                                            {repairItems.map(item => (
                                                <div key={item.repair.id} className="flex justify-between items-center text-sm p-3 glass-card border-white/5 border-l-2 border-l-finance">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold truncate max-w-[180px]">{item.repair.brand} {item.repair.model}</span>
                                                        <span className="text-[10px] text-slate-500">#{item.repair.id.toString().padStart(5, '0')}</span>
                                                    </div>
                                                    <span className="text-finance font-black">{formatUSD(item.repair.remaining_balance)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Input (Right) */}
                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Customer Selector */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} />
                                    Cliente
                                    {needsCustomer && <span className="text-rose-400">*</span>}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={12} /> Nuevo
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente por nombre o teléfono..."
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-primary-500 outline-none transition-all"
                                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setSelectedCustomer(null);
                                            setShowCustomerDropdown(true);
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                    />
                                    {selectedCustomer && (
                                        <button
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setCustomerSearch('');
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}

                                    {showCustomerDropdown && !selectedCustomer && customerSearch && (
                                        <div className="absolute z-10 w-full mt-2 glass-card border-white/10 rounded-xl overflow-hidden">
                                            {filteredCustomers?.length === 0 ? (
                                                <div className="p-4 text-center text-slate-500 text-sm">
                                                    No se encontraron clientes
                                                </div>
                                            ) : (
                                                filteredCustomers?.map(customer => (
                                                    <button
                                                        key={customer.id}
                                                        onClick={() => {
                                                            setSelectedCustomer(customer.id);
                                                            setShowCustomerDropdown(false);
                                                            setCustomerSearch('');
                                                        }}
                                                        className="w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-none"
                                                    >
                                                        <p className="text-sm font-bold text-white">{customer.name}</p>
                                                        <p className="text-[10px] text-slate-500">{customer.dni_type || 'V'}-{customer.dni || 'S/C'} • {customer.phone || 'Sin tel'}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-12 h-12 bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 flex-shrink-0"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Método de Pago</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: 'cash', label: 'Efectivo', icon: Wallet },
                                    { id: 'card', label: 'Punto/TDB', icon: CreditCard },
                                    { id: 'transfer', label: 'Pago Móvil', icon: CreditCard },
                                    { id: 'mixed', label: 'Mixto', icon: DollarSign },
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id as any)}
                                        className={`
                                            flex items-center gap-2 p-3 rounded-xl border transition-all duration-300
                                            ${paymentMethod === method.id
                                                ? 'bg-primary-600/10 border-primary-500 text-primary-400 shadow-glow'
                                                : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'}
                                        `}
                                    >
                                        <method.icon size={16} />
                                        <span className="text-[10px] font-black uppercase">{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount Paid */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Monto Recibido ({currency})</h3>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 group-focus-within:animate-pulse">
                                    {currency === 'USD' ? <DollarSign size={24} /> : <Wallet size={24} />}
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded-2xl pl-14 pr-6 text-2xl font-black text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Pending Debt Display */}
                        {hasPendingDebt && (
                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${needsCustomer && !selectedCustomerId ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                                <AlertCircle className={needsCustomer && !selectedCustomerId ? 'text-rose-400' : 'text-amber-400'} size={20} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-white uppercase">Saldo Deudor</p>
                                        <p className="text-lg font-black text-finance">{formatUSD(pendingDebt)}</p>
                                    </div>
                                    <p className="text-xs text-slate-400">≈ {formatVES(pendingDebt * activeRate)}</p>

                                    {needsCustomer && !selectedCustomerId && (
                                        <p className="text-xs text-rose-400 mt-2 font-bold">
                                            ⚠️ Debes seleccionar un cliente para registrar el abono
                                        </p>
                                    )}

                                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPartialPayment}
                                            onChange={(e) => setIsPartialPayment(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-600 text-primary-500 focus:ring-primary-500/50"
                                        />
                                        <span className="text-xs font-bold text-slate-300">Registrar como Abono/Crédito</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Notas / Referencia</h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Añade una nota o número de referencia..."
                                className="w-full h-20 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none resize-none"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleProcessPayment}
                                disabled={isProcessing || !canProcess}
                                className="flex-[2] btn-primary py-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>{hasPendingDebt ? 'Registrar Abono' : 'Confirmar Pago'}</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-background/50 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-600 font-medium tracking-tight">
                        Al confirmar, se descontará el stock, se actualizarán los saldos y se registrará la transacción en la caja activa.
                    </p>
                </div>
            </div>

            {/* Customer Quick Modal */}
            <CustomerQuickModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onCustomerCreated={(customerId) => {
                    setSelectedCustomer(customerId);
                    queryClient.invalidateQueries({ queryKey: ['customers'] });
                    setShowCustomerModal(false);
                }}
            />
        </div>
    );
}

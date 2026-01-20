import { useState, useEffect } from 'react';
import { RefreshCw, Wallet, ArrowRight, Loader2 } from 'lucide-react';
import ProductCatalog from './components/ProductCatalog';
import CartPanel from './components/CartPanel';
import PaymentModal from './components/PaymentModal';
import WorkOrderForm from '../Repairs/components/WorkOrderForm';
import { Plus } from 'lucide-react';
import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { useFinanceStore } from '@/store/financeStore';
import { formatUSD, formatVES } from '@/utils/currency';
import { toast } from 'sonner';

export default function POS() {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
    const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
    const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
    const { rate, fetchRate } = useExchangeRateStore();
    const { activeSession, isLoading, checkActiveSession, openSession, closeSession } = useFinanceStore();

    useEffect(() => {
        checkActiveSession();
    }, []);

    useEffect(() => {
        if (!isLoading && !activeSession) {
            setIsOpenSessionModalOpen(true);
        } else {
            setIsOpenSessionModalOpen(false);
        }
    }, [activeSession, isLoading]);

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
            {/* POS Header / Stats */}
            <div className="flex items-center justify-between glass-card p-4 px-6 border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {activeSession ? `Caja Abierta: #${activeSession.session_code.split('-').pop()}` : 'Caja Cerrada'}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex items-center gap-3 group text-center sm:text-left">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Tasa del Día</span>
                            <span className="text-sm font-black text-finance">1 USD = {formatVES(rate).split('Bs.')[1]} Bs.</span>
                        </div>
                        <button 
                            onClick={() => fetchRate()}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-finance transition-all group-hover:rotate-180 duration-500"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {activeSession && (
                        <button 
                            onClick={() => setIsCloseSessionModalOpen(true)}
                            className="flex items-center gap-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-xl border border-rose-500/20 transition-all text-xs font-black uppercase tracking-widest"
                        >
                            <Wallet size={16} />
                            <span>Cerrar Caja</span>
                        </button>
                    )}
                    <button 
                        onClick={() => setIsWorkOrderOpen(true)}
                        className="flex items-center gap-2 bg-primary-500/10 text-primary-400 hover:bg-primary-500 hover:text-white px-4 py-2 rounded-xl border border-primary-500/20 transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <Plus size={16} />
                        <span>Nueva Orden</span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-primary-400 font-black">
                        POS
                    </div>
                </div>
            </div>

            {/* Main POS Interface */}
            <div className="flex-1 flex gap-6 min-h-0">
                <div className="flex-[0.65] min-w-0">
                    <ProductCatalog />
                </div>
                <div className="flex-[0.35] glass-card px-0 overflow-hidden border-white/5 flex flex-col">
                    <div className="flex-1 p-6 flex flex-col min-h-0">
                        <CartPanel onCheckout={() => setIsPaymentModalOpen(true)} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)} 
            />

            <OpenSessionModal 
                isOpen={isOpenSessionModalOpen}
                onOpen={openSession}
            />

            <CloseSessionModal 
                isOpen={isCloseSessionModalOpen}
                onClose={() => setIsCloseSessionModalOpen(false)}
                onConfirm={closeSession}
                activeSession={activeSession}
                rate={rate}
            />

            <WorkOrderForm 
                isOpen={isWorkOrderOpen}
                onClose={() => setIsWorkOrderOpen(false)}
            />
        </div>
    );
}

function OpenSessionModal({ isOpen, onOpen }: { isOpen: boolean, onOpen: (amount: number, amountVes: number) => Promise<void> }) {
    const [amount, setAmount] = useState('0');
    const [amountVes, setAmountVes] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleOpen = async () => {
        setIsSubmitting(true);
        try {
            await onOpen(parseFloat(amount) || 0, parseFloat(amountVes) || 0);
            toast.success('Caja abierta exitosamente');
        } catch (error: any) {
            toast.error('Error al abrir caja', {
                description: error.response?.data?.detail || 'Error desconocido'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl"></div>
            <div className="relative glass-card w-full max-w-md p-8 border-white/10 animate-fade-in-up">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
                        <Wallet size={48} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic">Apertura de Caja</h2>
                        <p className="text-slate-400 mt-2 text-sm font-medium">Ingresa el efectivo inicial disponible en gaveta para comenzar el turno.</p>
                    </div>

                    <div className="w-full space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 font-black text-xl">$</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-6 text-2xl font-black text-white focus:border-primary-500 outline-none transition-all"
                                    placeholder="0.00 USD"
                                />
                                <label className="absolute -top-2.5 left-4 px-2 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest">Efectivo USD</label>
                            </div>

                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-black text-sm">Bs.</span>
                                <input 
                                    type="number" 
                                    value={amountVes}
                                    onChange={(e) => setAmountVes(e.target.value)}
                                    className="w-full h-14 bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-6 text-xl font-black text-white focus:border-amber-500 outline-none transition-all"
                                    placeholder="0.00 VES"
                                />
                                <label className="absolute -top-2.5 left-4 px-2 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest">Efectivo VES</label>
                            </div>
                        </div>

                        <button 
                            onClick={handleOpen}
                            disabled={isSubmitting}
                            className="btn-primary w-full py-4 text-lg font-bold group shadow-glow"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>Iniciar Turno</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CloseSessionModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    activeSession,
    rate
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onConfirm: (amount: number, amountVes: number, notes?: string) => Promise<void>,
    activeSession: any,
    rate: number
}) {
    const [actualAmount, setActualAmount] = useState('0');
    const [actualAmountVes, setActualAmountVes] = useState('0');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !activeSession) return null;

    const diffUsd = (parseFloat(actualAmount) || 0) - (activeSession.expected_amount || 0);
    const diffVes = (parseFloat(actualAmountVes) || 0) - (activeSession.expected_amount_ves || 0);
    
    // Require notes if diff > $5 (abs)
    const needsNotes = Math.abs(diffUsd) > 5 || Math.abs(diffVes / rate) > 5;

    const handleClose = async () => {
        if (needsNotes && !notes) {
            toast.error('Se requiere una nota explicativa para diferencias mayores a 5 USD');
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(parseFloat(actualAmount) || 0, parseFloat(actualAmountVes) || 0, notes);
            toast.success('Caja cerrada exitosamente');
            onClose();
        } catch (error: any) {
            toast.error('Error al cerrar caja', {
                description: error.response?.data?.detail || 'Error desconocido'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={onClose}></div>
            <div className="relative glass-card w-full max-w-lg p-8 border-white/10 animate-fade-in-up">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                            <Wallet size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase italic">Cierre de Caja</h2>
                            <p className="text-slate-500 text-xs font-medium">Cuenta y registra el efectivo físico total en la gaveta.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Esperado USD</span>
                            <p className="text-xl font-black text-white">{formatUSD(activeSession.expected_amount)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Esperado VES</span>
                            <p className="text-xl font-black text-white">{formatVES(activeSession.expected_amount_ves)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 font-black">$</span>
                                <input 
                                    type="number" 
                                    value={actualAmount}
                                    onChange={(e) => setActualAmount(e.target.value)}
                                    className="w-full h-14 bg-slate-900/50 border border-slate-700 rounded-2xl pl-10 pr-4 text-xl font-black text-white focus:border-primary-500 outline-none transition-all"
                                    placeholder="0.00"
                                />
                                <label className="absolute -top-2.5 left-4 px-2 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contado USD</label>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">Bs.</span>
                                <input 
                                    type="number" 
                                    value={actualAmountVes}
                                    onChange={(e) => setActualAmountVes(e.target.value)}
                                    className="w-full h-14 bg-slate-900/50 border border-slate-700 rounded-2xl pl-11 pr-4 text-xl font-black text-white focus:border-amber-500 outline-none transition-all"
                                    placeholder="0.00"
                                />
                                <label className="absolute -top-2.5 left-4 px-2 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contado VES</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={`text-center py-2 rounded-xl text-xs font-black uppercase ${diffUsd === 0 ? 'text-slate-500' : diffUsd > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                Dif: {diffUsd > 0 ? '+' : ''}{formatUSD(diffUsd)}
                            </div>
                            <div className={`text-center py-2 rounded-xl text-xs font-black uppercase ${diffVes === 0 ? 'text-slate-500' : diffVes > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                Dif: {diffVes > 0 ? '+' : ''}{formatVES(diffVes)}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas de Cierre {needsNotes && <span className="text-rose-500">*</span>}</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:border-primary-500 outline-none min-h-[80px]"
                                placeholder={needsNotes ? "Debe explicar la diferencia..." : "Notas opcionales..."}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-[0.4] py-4 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-[0.6] btn-primary py-4 text-lg font-bold shadow-glow"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Cierre"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

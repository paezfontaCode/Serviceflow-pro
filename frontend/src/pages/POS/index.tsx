import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Loader2, Maximize2, Minimize2, Plus, ArrowRight } from 'lucide-react';
import ProductCatalog from './components/ProductCatalog';
import CartPanel from './components/CartPanel';
import PaymentModal from './components/PaymentModal';
import WorkOrderForm from '../Repairs/components/WorkOrderForm';
import OmniSearch from './components/OmniSearch';
import { useFinanceStore } from '@/store/financeStore';
import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { toast } from 'sonner';
import { CurrencySwitch } from '@/components/common/CurrencySwitch';
import { POSLayout } from './components/POSLayout';
import { formatUSD, formatVES } from '@/utils/currency';

export default function POS() {
    const { t } = useTranslation();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
    const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
    const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');

    const { activeSession, isLoading, checkActiveSession, openSession, closeSession } = useFinanceStore();
    const { rate } = useExchangeRateStore();

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

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const handleOmniSearch = (query: string) => {
        setGlobalSearch(query);
    };

    return (
        <POSLayout
            header={
                <div className="flex items-center justify-between glass-card p-3 px-6 border-white/5 gap-6">
                    {/* Left: Session Info & Rate */}
                    <div className="flex items-center gap-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 animate-pulse' : 'bg-rose-500'}`}></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('pos.session_status')}</span>
                                <span className="text-xs font-black text-slate-300">
                                    {activeSession ? `${t('pos.open')} #${activeSession.session_code.split('-').pop()}` : t('pos.closed')}
                                </span>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/5"></div>

                        <CurrencySwitch />
                    </div>

                    {/* Center: OmniSearch */}
                    <div className="flex-1 max-w-xl">
                        <OmniSearch
                            onSearch={handleOmniSearch}
                            placeholder="Buscar productos, Cód. Barras o #Ticket..."
                        />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        {activeSession && (
                            <button
                                onClick={() => setIsCloseSessionModalOpen(true)}
                                className="flex items-center gap-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-3 py-2 rounded-xl border border-rose-500/20 transition-all text-[10px] font-black uppercase tracking-widest group"
                            >
                                <Wallet size={14} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">{t('pos.close_session')}</span>
                            </button>
                        )}

                        <button
                            onClick={() => setIsWorkOrderOpen(true)}
                            className="flex items-center gap-2 bg-primary-500/10 text-primary-400 hover:bg-primary-500 hover:text-white px-3 py-2 rounded-xl border border-primary-500/20 transition-all text-[10px] font-black uppercase tracking-widest group"
                        >
                            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                            <span className="hidden sm:inline">{t('pos.new_order')}</span>
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-white/5"
                            title="Pantalla Completa"
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>
                </div>
            }
        >
            {/* Products Grid */}
            <div className="flex-[0.65] min-w-0 h-full">
                <ProductCatalog searchQuery={globalSearch} />
            </div>

            {/* Cart Sidebar */}
            <div className="flex-[0.35] glass-card px-0 overflow-hidden border-white/5 flex flex-col h-full">
                <CartPanel onCheckout={() => setIsPaymentModalOpen(true)} />
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
        </POSLayout>
    );
}

// ... Keep existing OpenSessionModal and CloseSessionModal for now, can extract later if needed

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
    activeSession: { session_code: string; expected_amount: number; expected_amount_ves: number } | null,
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

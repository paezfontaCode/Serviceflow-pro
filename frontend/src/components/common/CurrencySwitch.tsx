import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { RefreshCw } from 'lucide-react';
import { formatExchangeRate } from '@/utils/currency';

export const CurrencySwitch = () => {
    const { rate, source, fetchRate, syncRate, isLoading } = useExchangeRateStore();

    const handleSync = async () => {
        try {
            await syncRate();
        } catch (err) {
            // Fallback to normal fetch if auto-sync fails
            fetchRate();
        }
    };

    const isAuto = source?.toLowerCase().includes('auto');

    return (
        <div className="flex items-center gap-3 group text-center sm:text-left bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-all">
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tasa</span>
                    <span className={`text-[8px] font-black px-1 rounded ${isAuto ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {isAuto ? 'AUTO' : 'MANUAL'}
                    </span>
                </div>
                <span className="text-sm font-black text-finance">1$ = {formatExchangeRate(rate)} Bs</span>
            </div>
            <button
                onClick={handleSync}
                disabled={isLoading}
                className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-finance transition-all disabled:opacity-50"
                title="Sincronizar con BCV"
            >
                <RefreshCw size={14} className={`transition-transform duration-700 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            </button>
        </div>
    );
};

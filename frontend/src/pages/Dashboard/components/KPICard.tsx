import { ArrowUpRight, Loader2, LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: LucideIcon;
    trend: string;
    color: 'primary' | 'finance' | 'warning' | 'danger';
    loading?: boolean;
}

export default function KPICard({ title, value, subValue, icon: Icon, trend, color, loading }: KPICardProps) {
    const colorMap = {
        primary: 'text-primary-400 bg-primary-500/10 shadow-glow',
        finance: 'text-finance bg-finance/10',
        warning: 'text-amber-400 bg-amber-500/10',
        danger: 'text-rose-400 bg-rose-500/10',
    };

    if (loading) {
        return (
            <div className="glass-card p-6 border-white/5 h-[160px] flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-700" size={32} />
            </div>
        );
    }

    return (
        <div className="glass-card p-6 border-white/5 group hover:scale-[1.02] transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <ArrowUpRight size={12} />
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-white">{value}</p>
                    {subValue && <span className="text-xs font-bold text-slate-500">≈ {subValue}</span>}
                </div>
            </div>
        </div>
    );
}

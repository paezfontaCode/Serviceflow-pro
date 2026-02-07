import { LucideIcon } from 'lucide-react';

interface ActivityItemProps {
    icon: LucideIcon;
    title: string;
    time: string;
    desc: string;
    color: string;
    bg: string;
}

export default function ActivityItem({ icon: Icon, title, time, desc, color, bg }: ActivityItemProps) {
    return (
        <div className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
            </div>
            <div className="space-y-1 border-b border-white/5 pb-4 w-full">
                <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-white uppercase">{title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{time}</p>
                </div>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
    );
}

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RepairCard } from './RepairCard';
import { WorkOrder, RepairStatus } from '../../../types/repair.types';

interface KanbanColumnProps {
    id: RepairStatus;
    title: string;
    orders: WorkOrder[];
    isOverlay?: boolean;
}

export const KanbanColumn = ({ id, title, orders }: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({
        id: id
    });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-80 bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
            {/* Column Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-xl z-10">
                <h3 className="font-bold text-slate-300 tracking-tight flex items-center gap-2">
                    {title}
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs text-center min-w-[24px]">
                        {orders.length}
                    </span>
                </h3>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide"
            >
                <SortableContext
                    items={orders.map(o => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {orders.map((order) => (
                        <RepairCard key={order.id} order={order} />
                    ))}
                </SortableContext>

                {orders.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-slate-600 text-xs uppercase tracking-widest font-bold">
                        Vacío
                    </div>
                )}
            </div>
        </div>
    );
};

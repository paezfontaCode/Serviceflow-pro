import { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { RepairCard } from './RepairCard';
import { WorkOrder, RepairStatus } from '../../../types/repair.types';
import { createPortal } from 'react-dom';

interface KanbanBoardProps {
    orders: WorkOrder[];
    onStatusChange: (id: number, newStatus: RepairStatus) => void;
}

const COLUMNS: { id: RepairStatus; title: string }[] = [
    { id: 'RECEIVED', title: 'Recibido' },
    { id: 'IN_PROGRESS', title: 'En Revisión' },
    { id: 'ON_HOLD', title: 'En Espera' },
    { id: 'READY', title: 'Listo' },
    { id: 'DELIVERED', title: 'Entregado' },
];

export const KanbanBoard = ({ orders, onStatusChange }: KanbanBoardProps) => {
    const [activeOrder, setActiveOrder] = useState<WorkOrder | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Avoid accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const ordersByStatus = useMemo(() => {
        const grouped: Record<RepairStatus, WorkOrder[]> = {
            RECEIVED: [],
            IN_PROGRESS: [],
            ON_HOLD: [],
            READY: [],
            DELIVERED: [],
            CANCELLED: []
        };

        orders.forEach(order => {
            if (grouped[order.status]) {
                grouped[order.status].push(order);
            }
        });

        return grouped;
    }, [orders]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const orderId = active.id;
        const order = orders.find(o => o.id === orderId);
        if (order) setActiveOrder(order);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { over } = event;

        if (!over) {
            setActiveOrder(null);
            return;
        }

        // The over id could be a column id (string) or another card id (number)
        // We need to find which column we dropped into

        let newStatus: RepairStatus | null = null;

        // Check if dropped directly on a column
        if (Object.keys(ordersByStatus).includes(over.id as string)) {
            newStatus = over.id as RepairStatus;
        } else {
            // Dropped on another card, find that card's status
            const overOrder = orders.find(o => o.id === over.id);
            if (overOrder) {
                newStatus = overOrder.status;
            }
        }

        if (newStatus && activeOrder && activeOrder.status !== newStatus) {
            onStatusChange(activeOrder.id, newStatus);
        }

        setActiveOrder(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 h-full overflow-x-auto pb-4 items-start">
                {COLUMNS.map((col) => (
                    <div key={col.id} className="h-full">
                        <KanbanColumn
                            id={col.id}
                            title={col.title}
                            orders={ordersByStatus[col.id]}
                        />
                    </div>
                ))}
            </div>

            {createPortal(
                <DragOverlay>
                    {activeOrder ? <RepairCard order={activeOrder} isOverlay /> : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}

export type RepairStatus = 'RECEIVED' | 'IN_PROGRESS' | 'ON_HOLD' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type RepairPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface RepairItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_cost_usd: number;
    subtotal_usd: number;
}

export interface RepairLog {
    id: number;
    created_at: string;
    status_from?: string;
    status_to?: string;
    notes: string;
    user_name: string;
}

export interface WorkOrder {
    id: number;
    customer_id: number;
    customer_name: string;
    customer_phone?: string;
    device_model: string;
    device_imei?: string;
    problem_description: string;
    status: RepairStatus;
    priority: RepairPriority;
    notes?: string;
    created_at: string;
    updated_at: string;
    estimated_delivery?: string;
    technician_id?: number;
    technician_name?: string;

    // Financials
    labor_cost_usd: number;
    parts_cost_usd: number;
    total_cost_usd: number;
    paid_amount_usd: number;
    balance_due_usd: number;

    is_warranty_active?: boolean;
    warranty_expiration?: string;
    delivered_at?: string;
    is_recurring?: boolean;
    previous_repair_id?: number;
    items: RepairItem[];
    logs: RepairLog[];
}

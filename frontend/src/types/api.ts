export interface Category {
    id: number;
    name: string;
    description?: string;
}

export interface ProductRead {
    id: number;
    sku?: string;
    name: string;
    description?: string;
    price_usd: number;
    cost_usd: number;
    category_id?: number;
    brand?: string;
    model?: string;
    is_active: boolean;
    inventory_quantity: number;
    in_stock: boolean;
    category?: Category;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit' | 'mixed';

export interface SaleItemCreate {
    product_id: number;
    quantity: number;
}

export interface SaleCreate {
    customer_id?: number;
    payment_method: PaymentMethod;
    payment_currency: 'VES' | 'USD';
    notes?: string;
    items: SaleItemCreate[];
}

export interface SaleItemRead {
    id: number;
    product_id: number;
    quantity: number;
    unit_price_usd: number;
    subtotal_usd: number;
    product_name?: string;
}

export interface SaleRead {
    id: number;
    user_id: number;
    total_usd: number;
    total_ves: number;
    exchange_rate: number;
    exchange_rate_at_time?: number;
    payment_method: string;
    payment_currency: string;
    payment_status: string;
    created_at: string;
    items: SaleItemRead[];
    notes?: string;
    // Derived fields for history
    customer_name?: string;
    paid_amount?: number;
    pending_amount?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface WorkOrderCreate {
    customer_id: number;
    device_model: string;
    device_imei?: string;
    problem_description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    service_type: 'SOFTWARE' | 'HARDWARE' | 'REVISION';
    quick_service_tag?: string;
    repair_type: 'software' | 'hardware' | 'service';
    estimated_delivery?: string;
    labor_cost_usd: number;
    items_to_consume?: { product_id: number; quantity: number }[];
    missing_part_note?: string;
    status?: string;
}

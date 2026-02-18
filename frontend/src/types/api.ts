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

// --- Supplier Types ---
export interface SupplierBase {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    notes?: string;
    is_active: boolean;
}

export interface SupplierCreate extends Omit<SupplierBase, 'is_active'> {
    is_active?: boolean;
}

export interface SupplierRead extends SupplierBase {
    id: number;
    created_at: string;
    updated_at?: string;
}

// --- Purchase Types ---
export interface PurchaseItemCreate {
    product_id: number;
    quantity: number;
    unit_cost_usd: number;
}

export interface PurchaseItemRead {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_cost_usd: number;
    subtotal_usd: number;
}

export interface PurchaseOrderCreate {
    supplier_id: number;
    expected_date?: string;
    notes?: string;
    items: PurchaseItemCreate[];
}

export interface PurchaseOrderRead {
    id: number;
    supplier_id: number;
    supplier_name: string;
    user_id: number;
    username: string;
    status: 'draft' | 'ordered' | 'received' | 'cancelled';
    total_amount_usd: number;
    expected_date?: string;
    received_date?: string;
    notes?: string;
    created_at: string;
    items: PurchaseItemRead[];
}

export type PaymentMethod = 'cash_usd' | 'cash_ves' | 'zelle' | 'pago_movil' | 'card' | 'transfer';
export type SaleStatus = 'completed' | 'pending' | 'cancelled';

export interface SaleItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Sale {
    id: number;
    customer_id?: number;
    customer_name?: string;
    total_amount_usd: number;
    total_amount_ves: number; // Calculate at moment of sale
    exchange_rate: number;
    status: SaleStatus;
    payment_method: PaymentMethod;
    created_at: string;
    items: SaleItem[];
    notes?: string;
    paid_amount_usd?: number;
    pending_amount_usd?: number;
}

export interface CartItem {
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    stock: number;
}

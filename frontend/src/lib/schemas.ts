import { z } from 'zod';

/**
 * Validaciones comunes
 */
const currencySchema = z.coerce.number().multipleOf(0.01).nonnegative();
const phoneSchema = z.string().min(10, 'El teléfono debe tener al menos 10 dígitos');
const imeiSchema = z.string().regex(/^\d{15}$/, 'El IMEI debe tener exactamente 15 dígitos numéricos').optional().or(z.literal(''));

/**
 * Esquema para Órdenes de Reparación (Work Orders)
 */
export const WorkOrderSchema = z.object({
    customer_id: z.coerce.number().positive('Seleccione un cliente'),
    device_model: z.string().min(3, 'El modelo debe tener al menos 3 caracteres'),
    device_imei: imeiSchema,
    problem_description: z.string().min(5, 'La descripción del problema es muy corta'),
    service_type: z.enum(['SOFTWARE', 'HARDWARE', 'REVISION']),
    estimated_cost_usd: currencySchema.default(0),
    labor_cost_usd: currencySchema.default(0),
    notes: z.string().optional(),
});

/**
 * Esquema para Productos de Inventario
 */
export const ProductSchema = z.object({
    sku: z.string().min(3, 'El SKU debe tener al menos 3 caracteres'),
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    price_usd: currencySchema,
    cost_usd: currencySchema,
    category_id: z.coerce.number().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    min_stock: z.coerce.number().int().nonnegative().default(0),
});

/**
 * Esquema para Ventas (Sales)
 */
export const SaleItemSchema = z.object({
    product_id: z.coerce.number(),
    quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
    unit_price_usd: currencySchema,
});

export const SaleSchema = z.object({
    customer_id: z.coerce.number().optional(),
    items: z.array(SaleItemSchema).min(1, 'El carrito no puede estar vacío'),
    payment_method: z.enum(['cash', 'card', 'transfer', 'credit']),
    notes: z.string().optional(),
});

/**
 * Esquema para Gastos (Expenses)
 */
export const ExpenseSchema = z.object({
    category_id: z.coerce.number().positive('Seleccione una categoría'),
    amount: currencySchema.gt(0, 'El monto debe ser mayor a 0'),
    description: z.string().min(5, 'La descripción es muy corta'),
    payment_method: z.enum(['cash', 'transfer', 'other']).default('cash'),
});

/**
 * Esquema para Clientes (Customers)
 */
export const CustomerSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    dni: z.string().min(7, 'El documento debe tener al menos 7 caracteres'),
    dni_type: z.enum(['V', 'J', 'E', 'P']).default('V'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: phoneSchema.optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * Esquema para Proveedores (Suppliers)
 */
export const SupplierSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    contact_name: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    tax_id: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * Esquema para Órdenes de Compra
 */
export const PurchaseItemSchema = z.object({
    product_id: z.coerce.number().positive(),
    quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
    unit_cost_usd: currencySchema,
});

export const PurchaseOrderSchema = z.object({
    supplier_id: z.coerce.number().positive('Seleccione un proveedor'),
    expected_date: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(PurchaseItemSchema).min(1, 'La orden debe tener al menos un producto'),
});

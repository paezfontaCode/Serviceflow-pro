📱 Serviceflow - Sistema de Gestión Integral Completo  
Fecha de Creación: 2025-01-03  
Versión: 2.2.0 - ERP con Soporte para Moneda Dual (VES/USD) – Específico para Venezuela  
Estado: Listo para Implementación en Tienda Real

📋 Resumen Ejecutivo  
Serviceflow es una plataforma empresarial integral de gestión para tiendas de telefonía móvil en entornos de alta volatilidad cambiaria, como **Venezuela**. El sistema opera como un ERP completo, integrando gestión operativa, financiera, contable y fiscal, con soporte nativo para **dos monedas** (Bolívares VES y Dólares USD) y **tasas de cambio diarias**.

Esta versión incluye:

- Soporte para **moneda dual (VES/USD)** con gestión de tasas de cambio diaria
- Integración con **hardware real** (impresora térmica, cajón registrador)
- Notificaciones profesionales (**email + WhatsApp Business API**)
- Fiscalidad **configurable por país**
- Enfoque **MVP por fases** para tiendas reales
- Estructura backend corregida y lista para desarrollo

---

1. 🏷️ NOMBRE Y BRANDING DEL SISTEMA  
   **Nombre Propuesto**: Serviceflow  
   **Justificación**:

- **"Service"**: Servicio técnico y atención al cliente
- **"Flow"**: Flujo continuo de operaciones, finanzas e información  
  **Acrónimo/Nombre Corto**: SF-ERP  
  **Eslogan**: "Control Total. Finanzas Seguras. Negocio en Crecimiento."  
  **Identidad Visual Sugerida**:
- Colores: Azul corporativo (#1e40af) + Dorado financiero (#d97706) + Verde éxito (#059669)
- Semántica de colores: Azul (operaciones), Dorado (finanzas), Verde (éxito/profit)

---

2. 🏗️ ARQUITECTURA DEL SISTEMA  
   2.1 Arquitectura General - ERP Modular

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Next.js    │  │   Next.js    │  │   Next.js    │        │
│  │   (Admin)    │  │  (Vendedor)  │  │  (Tecnico)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (FastAPI)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Authentication (JWT) │ Rate Limiting │ CORS │ Audit  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  API Endpoints (RESTful) - 17 Módulos                  │    │
│  │  ├── /auth/*                    (Autenticación)         │    │
│  │  ├── /users/*                   (Gestión Usuarios)      │    │
│  │  ├── /customers/*               (CRM Clientes)          │    │
│  │  ├── /products/*                (Catálogo Productos)    │    │
│  │  ├── /inventory/*               (Control Stock)         │    │
│  │  ├── /sales/*                   (Ventas/POS)            │    │
│  │  ├── /repairs/*                 (Órdenes Reparación)    │    │
│  │  ├── /suppliers/*               (Proveedores) 🆕        │    │
│  │  ├── /purchase-orders/*         (Compras) 🆕            │    │
│  │  ├── /accounts-receivable/*     (Cuentas x Cobrar) 🆕   │    │
│  │  ├── /accounts-payable/*        (Cuentas x Pagar) 🆕    │    │
│  │  ├── /cash-sessions/*           (Caja) 🆕               │    │
│  │  ├── /expenses/*                (Gastos) 🆕             │    │
│  │  ├── /fiscal-documents/*        (Facturación) 🆕        │    │
│  │  ├── /reports/*                 (Estadísticas)          │    │
│  │  └── /settings/*                (Configuración)
│  │      /exchange-rates/*        (Tasas de Cambio) 🆕    │ │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ Auth Service  │  │ Sales Service │  │ Repair Svc    │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ Inventory Svc │  │ Customer Svc  │  │ Report Svc    │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ AR Service    │  │ AP Service    │  │ Cash Service  │ 🆕  │
│  │ (Cuentas x    │  │ (Cuentas x    │  │ (Caja)        │      │
│  │  Cobrar)      │  │  Pagar)       │  │               │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ Fiscal Svc    │  │ Expense Svc   │  │ Credit Svc    │ 🆕  |
│  │ (Facturación) │  │ (Gastos)      │  │ (Créditos)    │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      |
   ┌─────────────── ───────┐                                    |
│  │ Exchange Svc          │                                    |
│  │(Conversión monetaria) │                                    |
│  └───────────────────────┘
   ┌─────────────── ───────┐                                    |
│  │ Hardware Svc          │                                    |
│  │(Impresora, cajón) 🆕  │                                    |
│  └───────────────────────┘
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SQLAlchemy ORM (Repository Pattern)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Production) / SQLite (Development)         │    │
│  │  32 Tablas (13 Operacionales + 19 Financieras )
│  │   Base de dato : serviceflow
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3\. 💾 MODELO DE BASE DE DATOS COMPLETO

### 3.1 Resumen de Tablas

**Total: 28 Tablas**

**Tablas Operacionales (13):**

1.  users
2.  roles
3.  customers (ACTUALIZADA con campos de crédito)
4.  categories
5.  products
6.  inventory
7.  sales (ACTUALIZADA con campos de pago)
8.  sale_items
9.  repairs (ACTUALIZADA con campos de pago)
10. repair_items
11. repair_logs
12. payments
13. notifications

**Tablas Financieras (15):** 14. accounts_receivable (Cuentas por cobrar) 15. customer_payments (Pagos de clientes) 16. credit_transactions (Historial de crédito) 17. aging_report (Antigüedad de saldos) 18. suppliers (Proveedores) 19. purchase_orders (Órdenes de compra) 20. purchase_order_items (Items de compras) 21. supplier_invoices (Facturas de proveedores) 22. accounts_payable (Cuentas por pagar) 23. cash_sessions (Sesiones de caja) 24. cash_transactions (Movimientos de caja) 25. petty_cash (Caja chica) 26. expense_categories (Categorías de gastos) 27. expenses (Gastos operativos) 28. tax_rates (Tasas de impuestos) 29. fiscal_documents (Documentos fiscales) 30. fiscal_document_items (Items de documentos fiscales) 31. withholdings (Retenciones)
32.exchange_rates (moneda dual)

### 3.2 Tablas Financieras Detalladas

#### **TABLA: customers (ACTUALIZADA)**

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'España',
    dni VARCHAR(20),
    notes TEXT,
    loyalty_points INTEGER DEFAULT 0,

    -- Campos de gestión de crédito 🆕
    credit_limit DECIMAL(10,2) DEFAULT 0,           -- Límite de crédito máximo
    current_debt DECIMAL(10,2) DEFAULT 0,            -- Deuda actual
    payment_terms INTEGER DEFAULT 30,                 -- Días de crédito permitidos
    credit_status VARCHAR(20) DEFAULT 'active',       -- 'active', 'blocked', 'suspended'
    credit_score INTEGER DEFAULT 100,                 -- Score de crédito 0-100
    last_payment_date DATE,                          -- Último pago realizado

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_dni ON customers(dni);
CREATE INDEX idx_customers_credit_status ON customers(credit_status);
```

---

#### **TABLA: accounts_receivable (NUEVA)**

```sql
-- Cuentas por cobrar - Cartera de clientes
CREATE TABLE accounts_receivable (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    sale_id INTEGER REFERENCES sales(id),
    repair_id INTEGER REFERENCES repairs(id),

    -- Montos
    total_amount DECIMAL(10,2) NOT NULL,             -- Monto total de la cuenta
    paid_amount DECIMAL(10,2) DEFAULT 0,            -- Monto pagado
    balance DECIMAL(10,2) NOT NULL,                 -- Saldo pendiente

    -- Fechas
    due_date DATE NOT NULL,                         -- Fecha de vencimiento
    overdue_days INTEGER DEFAULT 0,                 -- Días vencidos
    last_payment_date DATE,                         -- Último pago

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',            -- 'pending', 'partial', 'paid', 'overdue', 'written_off'

    -- Configuración
    interest_rate DECIMAL(5,2) DEFAULT 2.00,        -- Interés por mora (% mensual)
    interest_amount DECIMAL(10,2) DEFAULT 0,        -- Intereses acumulados

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_ar_customer ON accounts_receivable(customer_id);
CREATE INDEX idx_ar_status ON accounts_receivable(status);
CREATE INDEX idx_ar_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_ar_sale ON accounts_receivable(sale_id);
CREATE INDEX idx_ar_repair ON accounts_receivable(repair_id);
```

---

#### **TABLA: customer_payments (NUEVA)**

```sql
-- Pagos de clientes (abonos parciales)
CREATE TABLE customer_payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    account_receivable_id INTEGER REFERENCES accounts_receivable(id),
    sale_id INTEGER REFERENCES sales(id),
    repair_id INTEGER REFERENCES repairs(id),

    -- Monto del pago
    amount DECIMAL(10,2) NOT NULL,                  -- Monto del abono
    balance_before DECIMAL(10,2) NOT NULL,          -- Saldo antes del pago
    balance_after DECIMAL(10,2) NOT NULL,           -- Saldo después del pago

    -- Método de pago
    payment_method VARCHAR(50) NOT NULL,            -- 'cash', 'card', 'transfer'
    payment_reference VARCHAR(100),                 -- Referencia del pago

    -- Descripción
    description TEXT,
    notes TEXT,

    -- Auditoría
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cp_customer ON customer_payments(customer_id);
CREATE INDEX idx_cp_ar ON customer_payments(account_receivable_id);
CREATE INDEX idx_cp_date ON customer_payments(payment_date);
```

---

#### **TABLA: credit_transactions (NUEVA)**

```sql
-- Histórico de transacciones de crédito de clientes
CREATE TABLE credit_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    transaction_type VARCHAR(20) NOT NULL,          -- 'credit', 'debit', 'payment', 'write_off'
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,

    -- Referencia a documento origen
    reference_type VARCHAR(50),                     -- 'sale', 'repair', 'payment', 'adjustment'
    reference_id INTEGER,

    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ct_customer ON credit_transactions(customer_id);
CREATE INDEX idx_ct_type ON credit_transactions(transaction_type);
CREATE INDEX idx_ct_date ON credit_transactions(created_at);
```

---

#### **TABLA: aging_report (NUEVA)**

```sql
-- Reporte de antigüedad de saldos (calculado periódicamente)
CREATE TABLE aging_report (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    report_date DATE NOT NULL,

    -- Saldos por período
    current_balance DECIMAL(10,2) DEFAULT 0,        -- 0-30 días (corriente)
    days_30_60 DECIMAL(10,2) DEFAULT 0,
    days_60_90 DECIMAL(10,2) DEFAULT 0,
    days_90_plus DECIMAL(10,2) DEFAULT 0,

    total_balance DECIMAL(10,2) NOT NULL,
    overdue_balance DECIMAL(10,2) DEFAULT 0,        -- Total vencido

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aging_customer ON aging_report(customer_id);
CREATE INDEX idx_aging_date ON aging_report(report_date);
```

---

#### **TABLA: suppliers (NUEVA)**

```sql
-- Proveedores
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(50),                              -- RIF/CIF/NIT/RUT
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'España',

    -- Condiciones de pago
    payment_terms INTEGER DEFAULT 30,                 -- Días de crédito
    credit_limit DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    rating INTEGER DEFAULT 5,                        -- Calificación 1-5
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_name ON suppliers(company_name);
CREATE INDEX idx_suppliers_tax_id ON suppliers(tax_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
```

---

#### **TABLA: purchase_orders (NUEVA)**

```sql
-- Órdenes de compra
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(20) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER REFERENCES users(id),

    -- Montos
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,

    -- Fechas
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    due_date DATE,                                   -- Vencimiento de pago

    -- Estado
    status VARCHAR(20) DEFAULT 'ordered',            -- 'ordered', 'received', 'cancelled'
    payment_status VARCHAR(20) DEFAULT 'pending',    -- 'pending', 'partial', 'paid'

    -- Auditoría
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_po_code ON purchase_orders(order_code);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_date ON purchase_orders(order_date);
```

---

#### **TABLA: purchase_order_items (NUEVA)**

```sql
-- Items de órdenes de compra
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    -- Recepción
    received_quantity INTEGER DEFAULT 0,
    remaining_quantity INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_poi_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_poi_product ON purchase_order_items(product_id);
```

---

#### **TABLA: supplier_invoices (NUEVA)**

```sql
-- Facturas de proveedores
CREATE TABLE supplier_invoices (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_order_id INTEGER REFERENCES purchase_orders(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Montos
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',            -- 'pending', 'partial', 'paid', 'overdue'
    payment_status VARCHAR(20) DEFAULT 'unpaid',

    -- Auditoría
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_si_supplier ON supplier_invoices(supplier_id);
CREATE INDEX idx_si_number ON supplier_invoices(invoice_number);
CREATE INDEX idx_si_status ON supplier_invoices(status);
```

---

#### **TABLA: accounts_payable (NUEVA)**

```sql
-- Cuentas por pagar
CREATE TABLE accounts_payable (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_order_id INTEGER REFERENCES purchase_orders(id),
    supplier_invoice_id INTEGER REFERENCES supplier_invoices(id),

    -- Montos
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,

    -- Fechas
    due_date DATE NOT NULL,
    overdue_days INTEGER DEFAULT 0,
    last_payment_date DATE,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',            -- 'pending', 'partial', 'paid', 'overdue'

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX idx_ap_supplier ON accounts_payable(supplier_id);
CREATE INDEX idx_ap_status ON accounts_payable(status);
CREATE INDEX idx_ap_due_date ON accounts_payable(due_date);
```

---

#### **TABLA: cash_sessions (NUEVA)**

```sql
-- Sesiones de caja (apertura y cierre)
CREATE TABLE cash_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_code VARCHAR(20) UNIQUE NOT NULL,

    -- Montos
    opening_amount DECIMAL(10,2) NOT NULL,           -- Monto inicial
    expected_closing DECIMAL(10,2),                 -- Cierre esperado
    actual_cash DECIMAL(10,2),                      -- Dinero físico en caja
    closing_amount DECIMAL(10,2),                   -- Monto de cierre registrado

    -- Diferencias
    shortage DECIMAL(10,2) DEFAULT 0,               -- Faltante
    overage DECIMAL(10,2) DEFAULT 0,                -- Sobrante

    -- Fechas
    opened_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP,

    -- Estado
    status VARCHAR(20) DEFAULT 'open',               -- 'open', 'closed'

    -- Auditoría
    opening_notes TEXT,
    closing_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cs_user ON cash_sessions(user_id);
CREATE INDEX idx_cs_code ON cash_sessions(session_code);
CREATE INDEX idx_cs_status ON cash_sessions(status);
CREATE INDEX idx_cs_date ON cash_sessions(opened_at);
```

---

#### **TABLA: cash_transactions (NUEVA)**

```sql
-- Movimientos de caja
CREATE TABLE cash_transactions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES cash_sessions(id),
    user_id INTEGER REFERENCES users(id),

    -- Tipo de transacción
    transaction_type VARCHAR(20) NOT NULL,           -- 'sale', 'payment', 'expense', 'refund', 'opening', 'closing'

    -- Monto
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,

    -- Referencia
    reference_type VARCHAR(50),                     -- 'sale', 'repair', 'expense', 'adjustment'
    reference_id INTEGER,

    -- Descripción
    description TEXT,
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_ct_session ON cash_transactions(session_id);
CREATE INDEX idx_ct_type ON cash_transactions(transaction_type);
CREATE INDEX idx_ct_date ON cash_transactions(created_at);
```

---

#### **TABLA: petty_cash (NUEVA)**

```sql
-- Caja chica para gastos menores
CREATE TABLE petty_cash (
    id SERIAL PRIMARY KEY,
    fund_id INTEGER,                                  -- Si hay múltiples cajas chicas
    user_id INTEGER REFERENCES users(id),

    -- Tipo de movimiento
    transaction_type VARCHAR(20) NOT NULL,           -- 'replenish', 'expense', 'adjustment'

    -- Monto
    amount DECIMAL(10,2) NOT NULL,
    balance DECIMAL(10,2) NOT NULL,                  -- Saldo después de la transacción

    -- Categoría de gasto
    expense_category VARCHAR(50),

    -- Descripción
    description TEXT,
    receipt_number VARCHAR(50),
    notes TEXT,

    -- Auditoría
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_pc_fund ON petty_cash(fund_id);
CREATE INDEX idx_pc_type ON petty_cash(transaction_type);
CREATE INDEX idx_pc_date ON petty_cash(transaction_date);
```

---

#### **TABLA: expense_categories (NUEVA)**

```sql
-- Categorías de gastos operativos
CREATE TABLE expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES expense_categories(id),
    budget_amount DECIMAL(10,2),                     -- Presupuesto mensual
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ec_name ON expense_categories(name);
CREATE INDEX idx_ec_active ON expense_categories(is_active);
```

---

#### **TABLA: expenses (NUEVA)**

```sql
-- Gastos operativos
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES expense_categories(id),
    user_id INTEGER REFERENCES users(id),

    -- Montos
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Fechas
    expense_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',            -- 'pending', 'approved', 'paid', 'rejected'
    payment_status VARCHAR(20) DEFAULT 'unpaid',

    -- Detalles
    description TEXT NOT NULL,
    vendor VARCHAR(100),
    invoice_number VARCHAR(50),
    payment_method VARCHAR(50),

    -- Aprobación
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Auditoría
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_user ON expenses(user_id);
```

---

#### **TABLA: tax_rates (NUEVA)**

```sql
-- Tasas de impuestos configurables
CREATE TABLE tax_rates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,                -- 'IVA', 'ISLR', 'RETENTION'
    rate DECIMAL(5,2) NOT NULL,                     -- Porcentaje
    country VARCHAR(100) DEFAULT 'España',
    tax_type VARCHAR(50) NOT NULL,                   -- 'sales', 'purchase', 'withholding'
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tr_code ON tax_rates(code);
CREATE INDEX idx_tr_type ON tax_rates(tax_type);
CREATE INDEX idx_tr_active ON tax_rates(is_active);
```

---

#### **TABLA: fiscal_documents (NUEVA)**

```sql
-- Documentos fiscales (facturas, notas de crédito/débito)
CREATE TABLE fiscal_documents (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(20) NOT NULL,              -- 'invoice', 'credit_note', 'debit_note'
    document_number VARCHAR(50) UNIQUE NOT NULL,
    series VARCHAR(20),                              -- Serie de facturación fiscal

    -- Relación
    sale_id INTEGER REFERENCES sales(id),
    customer_id INTEGER REFERENCES customers(id),
    repair_id INTEGER REFERENCES repairs(id),

    -- Montos
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_base DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Configuración fiscal
    tax_rate_id INTEGER REFERENCES tax_rates(id),
    withholding_tax_amount DECIMAL(10,2) DEFAULT 0,

    -- Fechas
    issue_date DATE NOT NULL,
    due_date DATE,

    -- Estado
    status VARCHAR(20) DEFAULT 'issued',             -- 'issued', 'cancelled', 'voided'
    payment_status VARCHAR(20) DEFAULT 'pending',

    -- Compliance
    electronic_signature BOOLEAN DEFAULT FALSE,
    sent_to_tax_authority BOOLEAN DEFAULT FALSE,
    tax_authority_response TEXT,

    -- Auditoría
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_fd_number ON fiscal_documents(document_number);
CREATE INDEX idx_fd_type ON fiscal_documents(document_type);
CREATE INDEX idx_fd_customer ON fiscal_documents(customer_id);
CREATE INDEX idx_fd_date ON fiscal_documents(issue_date);
```

---

#### **TABLA: fiscal_document_items (NUEVA)**

```sql
-- Items de documentos fiscales
CREATE TABLE fiscal_document_items (
    id SERIAL PRIMARY KEY,
    fiscal_document_id INTEGER REFERENCES fiscal_documents(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_fdi_document ON fiscal_document_items(fiscal_document_id);
```

---

#### **TABLA: withholdings (NUEVA)**

```sql
-- Retenciones de impuestos
CREATE TABLE withholdings (
    id SERIAL PRIMARY KEY,
    fiscal_document_id INTEGER REFERENCES fiscal_documents(id),
    customer_id INTEGER REFERENCES customers(id),
    supplier_id INTEGER REFERENCES suppliers(id),

    -- Tipo de retención
    withholding_type VARCHAR(50) NOT NULL,          -- 'iva', 'islr', 'municipal'
    tax_rate_id INTEGER REFERENCES tax_rates(id),

    -- Monto
    base_amount DECIMAL(10,2) NOT NULL,
    withholding_rate DECIMAL(5,2) NOT NULL,
    withholding_amount DECIMAL(10,2) NOT NULL,

    -- Referencia
    reference_number VARCHAR(50),

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_wh_fiscal ON withholdings(fiscal_document_id);
CREATE INDEX idx_wh_type ON withholdings(withholding_type);
```

---

### **TABLA: exchange_rates (NUEVA)**

```sql
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    base_currency CHAR(3) NOT NULL DEFAULT 'USD',
    target_currency CHAR(3) NOT NULL DEFAULT 'VES',
    rate DECIMAL(18,6) NOT NULL,
    source VARCHAR(50) NOT NULL,          -- 'BCV', 'Monitor', 'Manual'
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);
CREATE UNIQUE INDEX idx_exchange_date_active
ON exchange_rates(effective_date)
WHERE is_active = TRUE;

* * *

## 4\. 📦 DESCRIPCIÓN DETALLADA DE MÓDULOS FINANCIEROS

### 4.1 Módulo de Cuentas por Cobrar (Accounts Receivable)

**Funcionalidades Principales:**

-   Gestión completa de cartera de clientes
-   Registro automático de cuentas por cobrar en ventas a crédito
-   Sistema de abonos parciales
-   Cálculo automático de saldos pendientes
-   Reporte de antigüedad de saldos (Aging Report)
-   Gestión de intereses por mora
-   Bloqueo automático por límite de crédito
-   Alertas de clientes morosos
-   Conciliación de pagos

**Casos de Uso:**

**1\. Venta a Crédito:**

```

Input: Venta, cliente, método de pago = "crédito"
Validación:

- ¿credit_limit >= current_debt + venta.total?
- ¿credit_status = 'active'?
- ¿No tiene deudas vencidas > 30 días?
  Output:
- Venta registrada
- Cuenta por cobrar creada (accounts_receivable)
- Cliente actualizado (current_debt += venta.total)
- Transacción de crédito registrada

```

**2\. Abono Parcial:**

```

Input: Cliente, monto, método de pago
Validación:

- Saldo pendiente > 0
- Monto > 0
- Monto <= balance
  Output:
- Pago registrado (customer_payments)
- Cuenta por cobrar actualizada (paid_amount += amount, balance -= amount)
- Cliente actualizado (current_debt -= amount)
- Transacción de crédito registrada
- Si balance = 0: status = 'paid'

```

**3\. Cálculo de Intereses por Mora:**

```

Trigger: Diario sobre cuentas vencidas
Cálculo:

- overdue_days = fecha_actual - due_date
- interest_amount = balance _ (interest_rate/100) _ (overdue_days/30)
  Output:
- Intereses agregados al balance
- Notificación al cliente

```

**4\. Bloqueo por Crédito:**

```

Trigger: Validación antes de venta/repairación
Condiciones de bloqueo:

- current_debt > credit_limit
- overdue_balance > (current_debt \* 0.30) # 30% vencido
- credit_status = 'blocked' o 'suspended'
  Acción:
- Bloquear operación
- Mostrar alerta
- Opciones: pagar deuda o contactar administrador

```

**Validaciones:**

-   Límite de crédito >= current\_debt + nuevo\_monto
-   Payment\_status = 'pending' o 'partial' para ventas a crédito
-   Abono <= balance pendiente
-   Due\_date >= fecha actual (para nuevas cuentas)

**Integraciones:**

-   Sales Module: Crear cuentas por cobrar automáticamente
-   Customer Module: Actualizar límites y saldos
-   Notification Module: Alertas de vencimiento
-   Reports Module: Aging Report, cartera vencida

* * *

### 4.2 Módulo de Cuentas por Pagar (Accounts Payable)

**Funcionalidades Principales:**

-   Gestión de proveedores
-   Órdenes de compra
-   Recepción de mercancía
-   Facturación de proveedores
-   Cuentas por pagar
-   Programación de pagos
-   Control de vencimientos
-   Reportes de proveedores

**Casos de Uso:**

**1\. Solicitud de Compra:**

```

Input: Productos, cantidades, proveedor
Validación:

- Proveedor activo
- Stock <= min_stock para productos seleccionados
  Output:
- Orden de compra creada (purchase_orders)
- Items de orden creados (purchase_order_items)
- Notificación al proveedor

```

**2\. Recepción de Mercancía:**

```

Input: Orden de compra, cantidad recibida
Validación:

- Cantidad recibida <= cantidad ordenada
  Output:
- Inventario actualizado (inventory.quantity += received_quantity)
- Orden actualizada (actual_delivery_date, status = 'received')
- Items actualizados (received_quantity, remaining_quantity)

```

**3\. Registro de Factura de Proveedor:**

```

Input: Factura, montos, vencimiento
Validación:

- Orden de compra existe
- Montos coinciden (± 5% tolerancia)
  Output:
- Factura registrada (supplier_invoices)
- Cuenta por pagar creada (accounts_payable)
- Proveedor actualizado (current_balance += total_amount)

```

**4\. Pago a Proveedor:**

```

Input: Cuenta por pagar, monto, método de pago
Validación:

- Balance >= monto
  Output:
- Pago registrado
- Cuenta por pagar actualizada (paid_amount += amount, balance -= amount)
- Proveedor actualizado (current_balance -= amount)

```

**Validaciones:**

-   Proveedor activo y validado
-   Orden de compra existe y está en estado 'ordered'
-   Cantidad recibida <= cantidad ordenada
-   Monto factura ≈ monto orden de compra (± 5% tolerancia)

**Integraciones:**

-   Suppliers Module: Gestión de proveedores
-   Inventory Module: Actualización de stock en recepciones
-   Purchase Orders Module: Gestión de órdenes de compra
-   Accounts Payable Module: Cuentas por pagar
-   Reports Module: Reportes de proveedores

* * *

### 4.3 Módulo de Control de Caja

**Funcionalidades Principales:**

-   Apertura de caja con monto inicial
-   Registro de movimientos de caja
-   Cierre de caja (Z-Cut) con conciliación
-   Detección de faltantes/sobrantes
-   Gestión de caja chica
-   Reportes de turno
-   Arqueo de caja

**Casos de Uso:**

**1\. Apertura de Caja:**

```

Input: Usuario, monto inicial, notas
Validación:

- No hay sesión abierta para el usuario
- Monto inicial >= 0
  Output:
- Sesión de caja creada (cash_sessions)
- Movimiento de apertura registrado (cash_transactions)
- Estado = 'open'

```

**2\. Venta en Efectivo:**

```

Trigger: Automático en procesamiento de venta con payment_method = 'cash'
Output:

- Movimiento de caja registrado (cash_transactions)
- transaction_type = 'sale'
- amount = venta.total

```

**3\. Cierre de Caja:**

```

Input: Monto físico contado, notas
Proceso:

1. Calcular expected_closing:
   - opening_amount + ventas_efectivo + pagos_efectivo - gastos_efectivo - devoluciones
2. Calcular diferencia:
   - diferencia = actual_cash - expected_closing
3. Clasificar: - shortage = diferencia si diferencia < 0 - overage = diferencia si diferencia > 0
   Output:

- Sesión cerrada (status = 'closed')
- Reporte de turno generado
- Diferencias documentadas

```

**4\. Gasto de Caja Chica:**

```

Input: Categoría, monto, descripción, recibo
Validación:

- Monto <= límite de caja chica (configurado, ej: €50)
  Output:
- Movimiento registrado (petty_cash)
- Saldo actualizado
- Recibo/documento asociado

```

**Validaciones:**

-   Una sola sesión abierta por usuario a la vez
-   Monto inicial >= 0
-   Actual\_cash >= 0 en cierre
-   Gastos de caja chica <= límite configurado

**Integraciones:**

-   Sales Module: Registrar ingresos en efectivo
-   Payments Module: Registrar pagos en efectivo
-   Expenses Module: Registrar egresos de caja
-   Reports Module: Reporte de caja, arqueo

* * *

### 4.4 Módulo de Gastos Operativos

**Funcionalidades Principales:**

-   Registro de gastos operativos
-   Categorización de gastos
-   Aprobación de gastos (si aplica)
-   Control de presupuesto de gastos
-   Reportes de gastos
-   Análisis de gastos vs ingresos

**Casos de Uso:**

**1\. Registro de Gasto:**

```

Input: Categoría, monto, descripción, fecha
Validación:

- Categoría existe y está activa
- Monto > 0
- Fecha <= fecha actual
  Output:
- Gasto registrado (expenses)
- status = 'pending' (si requiere aprobación) o 'approved' (si no)

```

**2\. Solicitud de Reembolso:**

```

Input: Empleado, monto, descripción, recibo
Validación:

- Empleado activo
- Monto dentro de políticas de reembolso
  Output:
- Solicitud creada
- status = 'pending'
- Notificación al aprobador

```

**3\. Aprobación de Gasto:**

```

Input: Gasto ID, aprobado/rechazado, notas
Validación:

- Permisos de aprobación
- status = 'pending'
  Output:
- Estado actualizado (approved/rejected)
- Notificación al solicitante
- Si aprobado: presupuesto actualizado

```

**4\. Pago de Gasto:**

```

Input: Gasto, método de pago
Validación:

- status = 'approved'
  Output:
- Gasto pagado (payment_status = 'paid', paid_date = hoy)
- Movimiento de caja registrado (si pago en efectivo)
- Monto deducido del presupuesto mensual

```

**Validaciones:**

-   Categoría de gasto existe y está activa
-   Monto > 0
-   Fecha de gasto <= fecha actual
-   Presupuesto mensual no excedido (si aplica)

**Integraciones:**

-   Expense Categories Module: Gestión de categorías
-   Users Module: Solicitantes y aprobadores
-   Cash Module: Pago de gastos desde caja
-   Reports Module: Reportes de gastos

* * *

### 4.5 Módulo de Facturación Fiscal

**Funcionalidades Principales:**

-   Generación de documentos fiscales
-   Cálculo automático de impuestos
-   Gestión de series de facturación
-   Retenciones de impuestos
-   Notas de crédito/débito
-   Compliance fiscal
-   Exportación a sistemas tributarios

**Casos de Uso:**

**1\. Emisión de Factura:**

```

Input: Venta, datos fiscales del cliente
Proceso:

1. Calcular subtotal
2. Aplicar descuentos
3. Calcular base imponible
4. Obtener tasa de impuesto según país
5. Calcular impuestos: tax_amount = tax_base \* tax_rate
6. Calcular total: total = tax_base + tax_amount
   Output:

- Factura fiscal emitida (fiscal_documents)
- PDF generado
- XML para autoridad tributaria

```

**2\. Cálculo de Retención:**

```

Input: Factura, tipo de retención
Cálculo:

- base_amount = subtotal - descuentos
- withholding_amount = base_amount \* (withholding_rate/100)
  Output:
- Retención registrada (withholdings)
- Monto deducido del total

```

**3\. Nota de Crédito:**

```

Input: Factura original, motivo, monto
Validación:

- Factura existe
- Está pagada o parcialmente pagada
  Output:
- Nota de crédito emitida
- Factura original ajustada (total -= monto_nota_credito)
- Refund o abono al cliente

```

**4\. Envío a Autoridad Tributaria:**

```

Input: Documento fiscal
Proceso:

1. Formatear según normativa del país (XML/JSON)
2. Enviar a API del sistema tributario
3. Registrar respuesta
   Output:

- sent_to_tax_authority = true
- tax_authority_response guardada

```

**Validaciones:**

-   Datos fiscales del cliente completos
-   Número de factura único por serie
-   Series configuradas y activas
-   Tasas de impuestos válidas para el país

**Integraciones:**

-   Sales Module: Obtener datos de venta
-   Customers Module: Datos fiscales
-   Tax Rates Module: Tasas de impuestos
-   External APIs: Autoridades tributarias

* * *

### 4.6 Módulo de Reportes Financieros

**Funcionalidades Principales:**

-   Estado de Resultados (P&L)
-   Balance General
-   Flujo de Caja (Cash Flow)
-   Reporte de Rentabilidad por Producto
-   Reporte de Margen de Ganancia Real
-   Aging Report
-   Reporte de Proveedores
-   Exportación a Excel/PDF

**Casos de Uso:**

**1\. Estado de Resultados (P&L):**

```

Input: Rango de fechas
Cálculos:

1. Ingresos = SUM(sales.total) + SUM(repairs.final_cost)
2. Costo de Ventas = SUM(products.cost \* sale_items.quantity)
3. Utilidad Bruta = Ingresos - Costo de Ventas
4. Gastos Operativos = SUM(expenses.total_amount)
5. Utilidad Operativa = Utilidad Bruta - Gastos Operativos
6. Impuestos = SUM(fiscal_documents.tax_amount)
7. Utilidad Neta = Utilidad Operativa - Impuestos
   Output:

- Reporte P&L detallado
- Gráficos de tendencias
- Comparación con período anterior

```

**2\. Flujo de Caja (Cash Flow):**

```

Input: Rango de fechas
Cálculos:

1. Entradas Operativas:
   - Ventas en efectivo
   - Pagos de clientes
2. Salidas Operativas:
   - Pagos a proveedores
   - Gastos operativos
   - Compras de inventario
3. Flujo Neto = Entradas - Salidas
4. Saldo Final = Saldo Inicial + Flujo Neto
   Output:

- Reporte Cash Flow
- Desglose por categoría
- Proyecciones

```

**3\. Aging Report:**

```

Input: Fecha de reporte
Clasificación:

- 0-30 días (corriente): balance si overdue_days <= 30
- 30-60 días: balance si 30 < overdue_days <= 60
- 60-90 días: balance si 60 < overdue_days <= 90
- 90+ días (vencida): balance si overdue_days > 90
  Output:
- Reporte de antigüedad por cliente
- Totales por bucket
- % de cartera vencida
- Recomendaciones de cobranza

```

**Validaciones:**

-   Rango de fechas válido
-   Permisos para ver reportes financieros
-   Datos consistentes y reconciliados

**Integraciones:**

-   Todos los módulos: Recopilar datos
-   Export Module: Generar Excel/PDF
-   Charts Module: Visualizaciones

* * *

### 4.7 Módulo de Gestión de Créditos

**Funcionalidades Principales:**

-   Asignación de límites de crédito por cliente
-   Evaluación de historial de pago
-   Sistema de scoring de crédito
-   Bloqueos automáticos
-   Gestión de cobranzas
-   Alertas de riesgo

**Casos de Uso:**

**1\. Asignar Límite de Crédito:**

```

Input: Cliente, límite, plazos
Validación:

- Permisos de administrador
- Límite >= 0
- Plazos >= 7 días
  Output:
- credit_limit actualizado
- payment_terms actualizado
- Notificación al cliente

```

**2\. Calcular Score de Crédito:**

```

Input: Cliente
Cálculo (score 0-100):

1. Historial de pagos (40%):
   - Pagos a tiempo: 40 puntos
   - 1-30 días vencido: 30 puntos
   - 31-60 días vencido: 20 puntos
   - > 60 días vencido: 10 puntos
2. Antigüedad (20%):
   - > 2 años: 20 puntos
   - 1-2 años: 15 puntos
   - 6-12 meses: 10 puntos
   - <6 meses: 5 puntos
3. Volumen de compras (20%):
   - Alto: 20 puntos
   - Medio: 15 puntos
   - Bajo: 10 puntos
4. Referencias (10%): 0-10 puntos
5. Situación actual (10%): 0-10 puntos
   Output:

- credit_score actualizado
- credit_status según score:
  - Score >= 80: 'active'
  - Score 60-79: 'review'
  - Score < 60: 'suspended'

```

**3\. Revisar Bloqueos:**

```

Trigger: Diario
Condiciones:

1. Si current_debt > credit_limit:
   - credit_status = 'blocked'
2. Si overdue_balance > current_debt \* 0.30:
   - credit_status = 'blocked'
3. Si pagos_vencidos > 3: - credit_status = 'suspended'
   Output:

- Bloqueos aplicados/levantados
- Notificaciones a administrador

```

Módulo de Moneda Dual (VES/USD) – Específico para Venezuela 🆕

Objetivo: Permitir operaciones en USD (estable) y VES (local), con conversión en tiempo real
Flujo:
Admin ingresa tasa diaria (fuente: Monitor Dólar, BCV, etc.)
POS muestra precios en ambas monedas
Vendedor elige moneda al registrar venta/reparación
Sistema registra: monto exacto + moneda + tasa al momento
Reportes consolidados en USD (con opción de ver en VES)
Regla de oro: Nunca recalcular montos históricos. Guardar siempre la tasa vigente al momento de la operación.

**4\. Gestión de Cobranzas:**

```

Input: Cliente, acción
Acciones disponibles:

- Llamada telefónica
- WhatsApp/Email
- Visita presencial
- Carta de requerimiento
  Output:
- Registro de contacto
- Seguimiento en historial
- Actualización de estado si aplica

```

**Validaciones:**

-   Crédito solo asignado por administrador
-   Score actualizado mensualmente
-   Bloqueos automáticos revisables manualmente

**Integraciones:**

-   Customers Module: Actualizar límites y scores
-   Accounts Receivable Module: Historial de pagos
-   Notification Module: Alertas de riesgo
-   Sales/Repairs Module: Validación de crédito



* * *

## 5\. 🔄 FLUJOS DE TRABAJO FINANCIEROS

### 5.1 Flujo de Venta a Crédito Completo
(Se mantienen los flujos originales, con ajustes implícitos para moneda dual.)
Ejemplo: Venta a Crédito en Venezuela

Cliente elige pagar en USD o VES
Sistema valida crédito en USD (moneda base de límite)
Si paga en VES, se convierte usando la tasa del día
Se registra la venta con:
currency = 'VES'
exchange_rate_at_time = 38.500000
total_amount = 1500000 (VES)
La deuda en cartera se almacena en USD equivalente: 1500000 / 38.500000 = 38.96 USD
(Los demás flujos —Abonos, Cierre de caja, Compras, etc.— se adaptan de forma análoga.)

```

┌─────────────────────────────────────────────────────────────────┐
│ FLUJO DE VENTA A CRÉDITO │
└─────────────────────────────────────────────────────────────────┘

1. INICIO
   ↓
2. Cliente selecciona productos
   ↓
3. Vendedor agrega productos al carrito
   ↓
4. Cliente solicita pagar a crédito
   ↓
5. Vendedor selecciona método de pago = "crédito"
   ↓
6. SISTEMA VALIDA CRÉDITO DEL CLIENTE
   ├─ ¿Cliente tiene límite de crédito configurado?
   ├─ ¿credit_status = 'active'?
   ├─ ¿current_debt

Serviceflow Pro ERP es ahora un sistema completo de gestión empresarial para tiendas de telefonía móvil, con capacidades operativas, financieras, contables y fiscales profesionales.

**Total de Tablas: 28**  
**Total de Módulos: 15**  
**Total de Permisos: 105+**

El sistema está **listo para implementación** como un ERP completo.

---

**Documentación Creada Por**: SuperNinja AI Agent  
**Fecha**: 2025-01-03  
**Versión**: 2.0.0 - ERP Completo credit_limit?
└─ ¿No tiene deudas vencidas > 30 días?
↓ 7. SI VALIDACIÓN PASA:

- Continuar al paso 8
  ↓

8. SI VALIDACIÓN FALLA:
   - Mostrar alerta: "Crédito no disponible"
   - Opciones: Pagar en efectivo/tarjeta o Contactar administrador
     ↓
9. Cliente confirma compra
   ↓
10. Generar venta (status = 'completed', payment_status = 'pending')
    ↓
11. Crear cuenta por cobrar (accounts_receivable):
    - customer_id
    - sale_id
    - total_amount = venta.total
    - paid_amount = 0
    - balance = venta.total
    - due_date = fecha_actual + payment_terms
    - status = 'pending'
      ↓
12. Actualizar cliente:
    - current_debt += venta.total
      ↓
13. Generar factura fiscal (si aplica)
    ↓
14. Entregar productos/servicios
    ↓
15. FIN

```

### 5.2 Flujo de Abonos Parciales

```

┌─────────────────────────────────────────────────────────────────┐
│ FLUJO DE ABONOS PARCIALES │
└─────────────────────────────────────────────────────────────────┘

1. INICIO
   ↓
2. Cliente llega a realizar abono
   ↓
3. Vendedor consulta cuenta del cliente
   - Ver balance total adeudado
   - Ver cuentas por cobrar individuales
   - Ver antigüedad de saldos
     ↓
4. Cliente indica monto a abonar
   ↓
5. Vendedor registra pago:
   - Selecciona cuenta por cobrar (o se aplica automáticamente)
   - Ingresa monto
   - Selecciona método de pago (efectivo, tarjeta, transferencia)
     ↓
6. SISTEMA PROCESA PAGO:
   ├─ Crear registro en customer_payments
   │ • customer_id
   │ • account_receivable_id
   │ • amount (monto del abono)
   │ • payment_method
   │ • balance_before (saldo antes del abono)
   │ • balance_after (saldo después del abono)
   ├─ Actualizar cuenta por cobrar:
   │ • paid_amount += amount
   │ • balance -= amount
   │ • status = 'partial' (si balance > 0)
   │ • status = 'paid' (si balance = 0)
   └─ Registrar transacción de crédito:
   • transaction_type = 'payment'
   • amount
   • balance_before
   • balance_after
   ↓
7. Si el pago es en efectivo:
   - Registrar movimiento de caja
     ↓
8. Actualizar cliente:
   - current_debt -= amount
   - last_payment_date = hoy
     ↓
9. Si balance = 0:
   - Actualizar status de la venta a 'paid'
   - Notificar: "Cuenta completamente saldada"
     ↓
10. Generar recibo/comprobante
    ↓
11. FIN

```

### 5.3 Flujo de Reporte de Antigüedad (Aging Report)

```

┌─────────────────────────────────────────────────────────────────┐
│ FLUJO DE AGING REPORT │
└─────────────────────────────────────────────────────────────────┘

1. INICIO (Ejecución programada - Diario)
   ↓
2. Para cada cliente con deuda:
   ↓
3. Obtener todas las cuentas por cobrar pendientes
   - WHERE customer_id = X AND status IN ('pending', 'partial', 'overdue')
     ↓
4. Para cada cuenta por cobrar:
   ↓
5. Calcular días vencidos:
   - overdue_days = MAX(0, fecha_actual - due_date)
     ↓
6. Clasificar en bucket:
   - Si overdue_days <= 30: current_balance += balance
   - Si 30 < overdue_days <= 60: days_30_60 += balance
   - Si 60 < overdue_days <= 90: days_60_90 += balance
   - Si overdue_days > 90: days_90_plus += balance
     ↓
7. Si overdue_days > 0:
   - overdue_balance += balance
   - Actualizar status a 'overdue'
   - Calcular intereses por mora
     ↓
8. Calcular total_balance del cliente:
   - total_balance = current_balance + days_30_60 + days_60_90 + days_90_plus
     ↓
9. Crear o actualizar registro en aging_report:
   - customer_id
   - report_date = hoy
   - current_balance
   - days_30_60
   - days_60_90
   - days_90_plus
   - total_balance
   - overdue_balance
     ↓
10. Evaluar riesgo del cliente:
    - Si overdue_balance > total_balance \* 0.3: Riesgo ALTO
    - Si overdue_balance > total_balance \* 0.15: Riesgo MEDIO
    - Si overdue_balance <= total_balance \* 0.15: Riesgo BAJO
      ↓
11. Si riesgo ALTO:
    - Actualizar credit_status = 'blocked'
    - Notificar administrador
    - Bloquear ventas/repaciones a crédito
      ↓
12. Si riesgo MEDIO:
    - Actualizar credit_status = 'suspended'
    - Notificar administrador
      ↓
13. Si riesgo BAJO:
    - Actualizar credit_status = 'active'
      ↓
14. FIN

```

### 5.4 Flujo de Apertura y Cierre de Caja

```

┌─────────────────────────────────────────────────────────────────┐
│ FLUJO DE APERTURA Y CIERRE DE CAJA │
└─────────────────────────────────────────────────────────────────┘

1. APERTURA DE CAJA
   ↓
2. Vendedor inicia turno
   ↓
3. Sistema verifica: ¿No hay sesión abierta?
   - SI: Continuar
   - NO: Error "Ya tiene una sesión abierta"
     ↓
4. Vendedor ingresa monto inicial de caja
   ↓
5. Vendedor agrega notas opcionales
   ↓
6. Crear sesión de caja:
   - user_id
   - session_code (generado: CAJA-YYYYMMDD-XXXX)
   - opening_amount = monto inicial
   - status = 'open'
   - opened_at = ahora
     ↓
7. Registrar movimiento de apertura:
   - cash_transactions
   - session_id
   - transaction_type = 'opening'
   - amount = opening_amount
     ↓
8. CAJA ABIERTA - Listo para operar
   ↓

[OPERACIONES DEL DÍA]

- Ventas en efectivo → Movimientos +sale
- Pagos de clientes → Movimientos +payment
- Gastos de caja → Movimientos -expense
- Devoluciones → Movimientos -refund
  ↓

9. CIERRE DE CAJA
   ↓
10. Vendedor solicita cerrar caja
    ↓
11. Vendedor cuenta dinero físico:
    - Billetes y monedas
    - total = actual_cash
      ↓
12. Sistema calcula:
    - total_sales = SUM(amount) WHERE transaction_type = 'sale'
    - total_payments = SUM(amount) WHERE transaction_type = 'payment'
    - total_expenses = SUM(amount) WHERE transaction_type = 'expense'
    - total_refunds = SUM(amount) WHERE transaction_type = 'refund'
      ↓
13. Sistema calcula expected_closing:
    - expected_closing = opening_amount + total_sales + total_payments - total_expenses - total_refunds
      ↓
14. Sistema calcula diferencias:
    - diferencia = actual_cash - expected_closing
    - shortage = 0 si diferencia >= 0, sino diferencia
    - overage = diferencia si diferencia >= 0, sino 0
      ↓
15. Vendedor confirma cierre
    ↓
16. Actualizar sesión de caja:
    - expected_closing
    - actual_cash
    - closing_amount = actual_cash
    - shortage
    - overage
    - status = 'closed'
    - closed_at = ahora
      ↓
17. Registrar movimiento de cierre:
    - cash_transactions
    - transaction_type = 'closing'
    - amount = closing_amount
      ↓
18. Generar reporte de turno:
    - Ventas del día
    - Pagos recibidos
    - Gastos realizados
    - Devoluciones
    - Diferencias (faltantes/sobrantes)
      ↓
19. FIN

```

### 5.5 Flujo de Compras a Proveedores

```

┌─────────────────────────────────────────────────────────────────┐
│ FLUJO DE COMPRAS A PROVEEDORES │
└─────────────────────────────────────────────────────────────────┘

1. INICIO
   ↓
2. Administrador detecta necesidad de stock
   ↓
3. Crear orden de compra:
   - supplier_id
   - items: producto, cantidad, costo unitario
   - expected_delivery_date
     ↓
4. Generar purchase_order:
   - order_code (ej: OC-20250103-001)
   - status = 'ordered'
   - total_cost = SUM(items.quantity \* items.unit_cost)
     ↓
5. Enviar orden a proveedor (email/WhatsApp)
   ↓
6. Proveedor confirma orden
   ↓
7. Esperar entrega
   ↓
8. RECIBIR MERCANCÍA
   ↓
9. Verificar factura de proveedor
   ↓
10. Comparar con orden de compra:
    - Cantidades coinciden?
    - Precios coinciden?
    - Productos correctos?
      ↓
11. SI TODO CORRECTO:
    - Continuar al paso 12
      ↓
12. SI HAY DIFERENCIAS:
    - Registrar discrepancias
    - Contactar proveedor
    - Ajustar orden o rechazar parcial
      ↓
13. Registrar recepción:
    - purchase_order.status = 'received'
    - actual_delivery_date = hoy
      ↓
14. Para cada item recibido:
    - Actualizar inventory:
      • quantity += received_quantity
      • last_updated = ahora
    - Actualizar purchase_order_items:
      • received_quantity += cantidad
      • remaining_quantity -= cantidad
      ↓
15. Crear registro de factura de proveedor:
    - supplier_invoice_id
    - invoice_number
    - total_amount
    - due_date
    - status = 'pending'
      ↓
16. Crear cuenta por pagar (accounts_payable):
    - supplier_id
    - purchase_order_id
    - supplier_invoice_id
    - total_amount
    - due_date
    - balance = total_amount
    - status = 'pending'
      ↓
17. Actualizar supplier:
    - current_balance += total_amount
      ↓
18. Notificar administrador:
    - "Mercancía recibida"
    - "Cuenta por pagar creada"
    - "Vence en X días"
      ↓
19. FIN

```

### 5.6 Flujo de Facturación Fiscal

```

┌─────────────────────────────────────────────────────────────────┐
│ FLUJO DE FACTURACIÓN FISCAL │
└─────────────────────────────────────────────────────────────────┘

1. INICIO (Venta completada)
   ↓
2. Sistema determina si requiere factura fiscal:
   - Configuración del país
   - Tipo de cliente (particular/empresa)
   - Monto de la venta
     ↓
3. SI REQUIERE FACTURA:
   - Continuar al paso 4
     ↓
4. SI NO REQUIERE:
   - Generar ticket simple
   - FIN
     ↓
5. Obtener datos fiscales del cliente:
   - Nombre/Razón Social
   - RIF/CIF/NIT/DNI
   - Dirección fiscal
     ↓
6. Verificar datos fiscales:
   - Datos completos?
   - Formato correcto?
     ↓
7. Obtener serie de facturación:
   - Series activas configuradas
   - Seleccionar serie según tipo de venta
     ↓
8. Generar número de factura:
   - series + número consecutivo
   - Ej: A001-0000123
     ↓
9. Calcular montos:
   - subtotal = SUM(items.quantity \* items.price)
   - discount_amount = total descuentos
   - tax_base = subtotal - discount_amount
     ↓
10. Obtener tasa de impuesto:
    - Según país y tipo de producto
    - Ej: IVA 21% (España)
      ↓
11. Calcular impuesto:
    - tax_amount = tax_base \* tax_rate
      ↓
12. Calcular total:
    - total = tax_base + tax_amount
      ↓
13. Verificar retenciones:
    - Cliente requiere retención?
    - Calcular withholding si aplica
      ↓
14. Crear documento fiscal:
    - document_type = 'invoice'
    - document_number
    - series
    - sale_id
    - customer_id
    - subtotal
    - discount_amount
    - tax_base
    - tax_amount
    - total
    - tax_rate_id
    - withholding_tax_amount
    - issue_date = hoy
    - due_date = hoy + payment_terms
    - status = 'issued'
      ↓
15. Crear items del documento fiscal:
    - Para cada item de la venta
    - Copiar datos
    - Calcular impuestos por item
      ↓
16. SI hay retención:
    - Crear registro de withholding
    - Calcular monto de retención
      ↓
17. Generar representación:
    - PDF de la factura
    - Formato XML para autoridad tributaria
      ↓
18. Enviar a autoridad tributaria (si aplica):
    - API del sistema tributario
    - Registrar respuesta
    - sent_to_tax_authority = true
      ↓
19. Entregar factura al cliente:
    - Email
    - Impresa
      ↓
20. FIN

```

* * *

## 6\. 🎨 DISEÑO DE INTERFACES FINANCIERAS

### 6.1 Dashboard Financiero Administrador

```

┌─────────────────────────────────────────────────────────────────┐
│ 💰 serviceflow Pro ERP 👤 Admin 🔔 [10] │
├─────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 DASHBOARD FINANCIERO │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ │ │
│ │ ┌────────────┐ ┌────────────┐ ┌────────────┐ │ │
│ │ │💰 Ingresos │ │💸 Gastos │ │📈 Profit │ │ │
│ │ │ Mes │ │ Mes │ │ Neto │ │ │
│ │ │ €45,230 │ │ €12,450 │ │ €32,780 │ │ │
│ │ │+12% ▲ │ │ +5% ▲ │ │+18% ▲ │ │ │
│ │ └────────────┘ └────────────┘ └────────────┘ │ │
│ │ │ │
│ │ 📊 Estado de Resultados del Mes: │ │
│ │ ╔═══════════════════════════════════════════════════╗ │ │
│ │ ║ (+) Ingresos Operativos: €45,230 ║ │ │
│ │ ║ (-) Costo de Ventas: €18,500 ║ │ │
│ │ ║ (=) Utilidad Bruta: €26,730 ║ │ │
│ │ ║ (-) Gastos Operativos: €12,450 ║ │ │
│ │ ║ (=) Utilidad Operativa: €14,280 ║ │ │
│ │ ║ (-) Impuestos: €2,500 ║ │ │
│ │ ║ (=) Utilidad Neta: €11,780 ║ │ │
│ │ ╚═══════════════════════════════════════════════════╝ │ │
│ │ Margen Neto: 26.03% │ │
│ │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────┐ ┌──────────────────────┐ │
│ │ 💳 Cuentas por Cobrar │ │ 💼 Cuentas x Pagar │ │
│ ├─────────────────────────────────┤ ├──────────────────────┤ │
│ │ Total Cartera: €8,450 │ │ Total a Pagar: €5,230│ │
│ │ Vencida: €2,150 🔴 │ │ Vencida: €1,800 🔴 │ │
│ │ Corriente: €6,300 🟢 │ │ Corriente: €3,430 🟢 │ │
│ │ │ │ │ │
│ │ 📊 Aging Report: │ │ 📅 Próximos Pagos: │ │
│ │ • 0-30 días: €4,200 (50%) │ │ • Proveedor A: €1,500│ │
│ │ • 30-60 días: €2,100 (25%) │ │ Vence: 15/01 │ │
│ │ • 60-90 días: €1,275 (15%) │ │ • Proveedor B: €2,000│ │
│ │ • 90+ días: €875 (10%) │ │ Vence: 20/01 │ │
│ │ │ │ Ver todos → │ │
│ │ Ver detalle → │ └──────────────────────┘ │
│ └─────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏦 Flujo de Caja │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ╔═══════════════════════════════════════════════════╗ │ │
│ │ ║ Entradas: €35,450 ║ │ │
│ │ ║ Ventas efectivo: €28,200 ║ │ │
│ │ ║ Pagos clientes: €7,250 ║ │ │
│ │ ║ Salidas: €22,300 ║ │ │
│ │ ║ Pagos proveedores: €15,000 ║ │
│ │ ║ Gastos operativos: €7,300 ║ │
│ │ ║ ════════════════════════════════════════════════ ║ │ │
│ │ ║ Flujo Neto: €13,150 ║ │ │
│ │ ╚═══════════════════════════════════════════════════╝ │ │
│ │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔔 ALERTAS FINANCIERAS │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🔴 3 Clientes con riesgo ALTO (bloqueados) │ │
│ │ ⚠️ 5 Proveedores con pagos vencidos │ │
│ │ 📊 Stock crítico: 8 productos │ │
│ │ 💰 Cierre de caja pendiente: 2 vendedores │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────┘

```

### 6.2 Pantalla de Cuentas por Cobrar

```

┌─────────────────────────────────────────────────────────────────┐
│ 💳 Cuentas por Cobrar [Exportar] │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 🔍 Filtros: [Cliente: Todos▼] [Estado: Todos▼] │
│ [Fecha desde: 01/12/2024] [Fecha hasta: 03/01/2025] [Filtrar]│
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Resumen de Cartera │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Total Cartera: €8,450 │ Vencida: €2,150 (25.4%) │ │
│ │ Corriente: €6,300 (74.6%) │ Morosos: 5 clientes │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 📋 Lista de Cuentas por Cobrar │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Cliente │ Venta │ Vence │ Total │ Pagado │ Saldo │ Estado││
│ ├────────────────────────────────────────────────────────────┤│
│ │ Juan │VEN-001│15/12 │€1,200 │€800 │€400 │⚠️30d ││
│ │ Martín │ │ │ │ │ │vencido││
│ │ [Ver] │ │ │[Abono] │ │[Cobrar│ ││
│ │ │ │ │ │ │] │ ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ Ana │VEN-015│20/12 │€850 │€0 │€850 │🔴60d ││
│ │ López │ │ │ │ │ │vencido││
│ │ [Ver] │ │ │[Abono] │ │[Cobrar│ ││
│ │ │ │ │ │ │] │ ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ Pedro │VEN-020│02/01 │€650 │€200 │€450 │🟢Corr ││
│ │ García │ │ │ │ │ │iente ││
│ │ [Ver] │ │ │[Abono] │ │[Cobrar│ ││
│ │ │ │ │ │ │] │ ││
│ └────────────────────────────────────────────────────────────┘│
│ │
│ Páginas: [1] 2 3 4 5 ... Mostrando 1-10 de 45 │
│ │
│ [📊 Aging Report] [⚙️ Configurar Alertas] [➕ Nueva Cuenta] │
│ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💳 Detalle de Cuenta por Cobrar │
│ Cliente: Juan Martín │
│ Venta: VEN-001 │ Fecha: 10/12/2024 │
│ Vence: 15/12/2024 │ Días vencidos: 19 🚨 │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 💰 Montos: │
│ Total: €1,200 │ Pagado: €800 │ Saldo: €400 │
│ Intereses por mora: €12.67 │
│ ───────────────────────────────────────── │
│ Total a Pagar: €412.67 │
│ │
│ 📜 Historial de Pagos: │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fecha │ Monto │ Método │ Referencia │ Operador │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 20/12/2024 │ €400 │ Efectivo│ REC-001 │ Juan P. │ │
│ │ 10/01/2025 │ €400 │ Tarjeta │ REC-002 │ Juan P. │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 📝 Notas: Cliente contactedo el 15/12, prometió pago en 3 días │
│ Estado actual: Esperando pago │
│ │
│ [💵 Registrar Abono] [📧 Enviar Recordatorio] [📞 Llamar] │
│ │
└─────────────────────────────────────────────────────────────────┘

```

### 6.3 Pantalla de Control de Caja

```

┌─────────────────────────────────────────────────────────────────┐
│ 💵 Control de Caja CAJA-20250103-001 │
│ Turno: Juan Pérez Estado: ABIERTO ✅ │
├─────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Resumen de Sesión │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Apertura: 08:00 AM │ Monto Inicial: €500 │ │
│ │ Hora actual: 14:30 PM │ Tiempo transcurrido: 6h 30m │ │
│ │ │ │
│ │ 💰 Caja Actual: €2,340 │ │
│ │ Ventas: +€1,840 │ │
│ │ Pagos: +€400 │ │
│ │ Gastos: -€200 │ │
│ │ Devoluciones: -€100 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 📋 Movimientos de la Sesión │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Hora │ Tipo │ Descripción │ Monto │ Operador││
│ ├────────────────────────────────────────────────────────────┤│
│ │08:00 │ 🟢Apertura│ Apertura de caja │ +€500 │ Juan P.││
│ │09:15 │ 🟢Venta │ VEN-001 iPhone 13 │ +€699 │ Juan P.││
│ │10:30 │ 🔴Gasto │ Caja chica limpieza │ -€50 │ Juan P.││
│ │11:45 │ 🟢Pago │ Abono Ana López │ +€200 │ Juan P.││
│ │12:30 │ 🔴Devolución│ DEV-001 Charger │ -€25 │ Juan P.││
│ │14:15 │ 🟢Venta │ VEN-002 AirPods │ +€249 │ Juan P.││
│ └────────────────────────────────────────────────────────────┘│
│ │
│ [📄 Ver Todos los Movimientos] [📊 Reporte del Turno] │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💶 Caja Chica │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Saldo actual: €150 │ Límite: €200 │ │
│ │ │ │
│ │ Últimos movimientos: │ │
│ │ • -€50 Limpieza (10:30 AM) │ │
│ │ • -€30 Cafetería (12:00 PM) │ │
│ │ • +€200 Reposición (09:00 AM) │ │
│ │ │ │
│ │ [💶 Registrar Gasto Caja Chica] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ [❌ Cerrar Caja] [🔄 Abrir Nueva Sesión] │
│ │
└─────────────────────────────────────────────────────────────────┘

```

### 6.4 Pantalla de Gestión de Proveedores

```

┌─────────────────────────────────────────────────────────────────┐
│ 🏢 Gestión de Proveedores [➕ Nuevo] │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 🔍 Buscar: [___________________] [Buscar] Filtro: [Todos▼] │
│ │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Proveedor │ RIF │ Contacto │ Balance │ Estado │Acc││
│ ├────────────────────────────────────────────────────────────┤│
│ │ TechSpare │V-12345│ Ana García │ €1,500 │🟢Activo│👁️││
│ │ SL │ │ ana@... │ Vence: │ │ ││
│ │ [Ver] │ │ 612-345-678 │ 15/01 │ │ ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ MobileParts │J-67890│ Carlos Ruiz │ €2,800 │🟢Activo│👁️││
│ │ SA │ │ carlos@... │ Vence: │ │ ││
│ │ [Ver] │ │ 655-987-654 │ 20/01 │ │ ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ PhoneFix │E-24680│ María López │ €0 │🟢Activo│👁️││
│ │ Ltd │ │ maria@... │ │ │ │
│ │ [Ver] │ │ 611-234-567 │ │ │ ││
│ └────────────────────────────────────────────────────────────┘│
│ │
│ 📊 Resumen: │
│ Total Proveedores: 15 │ Activos: 13 │ Balance Total: €8,450│
│ Vencido: €1,800 (21.3%) │
│ │
│ Páginas: [1] 2 3 4 5 ... Mostrando 1-10 de 15 │
│ │
│ [📊 Reporte de Proveedores] [📦 Ver Órdenes de Compra] │
│ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🏢 Detalle de Proveedor │
│ TechSpare SL │
│ RIF: V-12345678-9 │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 👤 Contacto: │
│ Ana García │
│ 📧 ana.garcia@techspare.com │ 📞 612-345-678 │
│ 📍 Calle Principal 123, Madrid │
│ │
│ 💰 Condiciones de Pago: │
│ Crédito: €5,000 │ Plazo: 30 días │ Rating: ⭐⭐⭐⭐⭐ (5/5)│
│ Balance Actual: €1,500 │ Disponible: €3,500 │
│ │
│ 📦 Órdenes de Compra Activas: │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Código │ Fecha │ Total │ Estado │ Entrega │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ OC-2025-001│ 02/01 │ €2,500 │ Recibido│ 05/01 │ │
│ │ OC-2025-005│ 15/01 │ €1,800 │ Ordered│ 22/01 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 📄 Facturas Pendientes: │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Factura │ Fecha │ Vence │ Total │ Estado │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ FAC-001 │ 28/12 │ 27/01 │ €1,500 │ Pendiente │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ [➕ Nueva Orden de Compra] [💵 Registrar Pago] [📧 Contactar]│
│ │
└─────────────────────────────────────────────────────────────────┘

```

### 6.5 Pantalla de Facturación Fiscal

```

┌─────────────────────────────────────────────────────────────────┐
│ 📄 Facturación Fiscal [Nueva Factura]│
├─────────────────────────────────────────────────────────────────┤
│ │
│ 🔍 Buscar: [Número de factura] [Buscar] [📅 Exportar Reporte]│
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Resumen de Facturación │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Mes Actual: Enero 2025 │ │
│ │ Facturas Emitidas: 45 │ Total Facturado: €23,450 │ │
│ │ Impuestos Recaudados: €4,125 │ Notas Crédito: 3 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 📋 Últimas Facturas Emitidas │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ N°Factura │ Fecha │ Cliente │ Total │ Estado │Acciones││
│ ├────────────────────────────────────────────────────────────┤│
│ │ A001-00045│03/01 │ Juan Martín │ €699 │✅Emitida│👁️📧││
│ │ A001-00044│03/01 │ Ana López │ €249 │✅Emitida│👁️📧││
│ │ A001-00043│02/01 │ Pedro García │ €850 │⚠️Pendiente│👁️📧││
│ │ NC-00005 │02/01 │ Juan Martín │-€50 │✅Emitida│👁️📧││
│ └────────────────────────────────────────────────────────────┘│
│ │
│ 🎛️ Series de Facturación Activas: │
│ • A001: Ventas (Próximo: 00046) │ B001: Ventas Exentas │
│ • C001: Notas Crédito (Próximo: 00006) │
│ │
│ [⚙️ Configurar Series] [📊 Reporte Fiscal] [📤 Enviar Hacienda]│
│ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📄 Nueva Factura Fiscal │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 1️⃣ DATOS DEL CLIENTE │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tipo: ○ Particular ● Empresa │ │
│ │ │ │
│ │ Razón Social: [Tech Solutions SL___________] │ │
│ │ RIF/CIF/NIT: [B-12345678____________] │ │
│ │ Dirección Fiscal: [Calle Principal 45________________] │ │
│ │ Email: [facturacion@techsol.com____________] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 2️⃣ SELECCIONAR VENTA/REPARACIÓN │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Buscar venta o reparación: VEN-001_______] [🔍] │ │
│ │ │ │
│ │ O seleccionar: │ │
│ │ ○ Venta VEN-001 - Juan Martín - €699 │ │
│ │ ● Venta VEN-002 - Ana López - €249 │ │
│ │ ○ Reparación REP-045 - Pedro García - €150 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 3️⃣ RESUMEN DE FACTURA │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Subtotal: €249.00 │ │
│ │ Descuentos: -€0.00 │ │
│ │ Base Imponible: €249.00 │ │
│ │ IVA (21%): +€52.29 │ │
│ │ ───────────────────────────── │ │
│ │ TOTAL: €301.29 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 4️⃣ RETENCIONES (si aplica) │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tipo: [ISLR▼] Tasa: [2%] Base: [€249.00] │ │
│ │ Retención: €4.98 │ │
│ │ Total con Retención: €296.31 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ Serie: [A001▼] Fecha: [03/01/2025] Vence: [02/02/2025] │
│ │
│ [❌ Cancelar] [👁️ Vista Previa] [✅ Emitir Factura] │
│ │
└─────────────────────────────────────────────────────────────────┘

```

### 6.6 Pantalla de Reportes Financieros

```

┌─────────────────────────────────────────────────────────────────┐
│ 📊 Reportes Financieros [📥 Exportar] │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 📅 Período: [01/12/2024] - [03/01/2025] [Aplicar] │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📈 ESTADO DE RESULTADOS (P&L) │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ╔═══════════════════════════════════════════════════╗ │ │
│ │ ║ (+) INGRESOS OPERATIVOS €45,230 ║ │ │
│ │ ║ Ventas de productos €38,500 ║ │ │
│ │ ║ Reparaciones €6,730 ║ │ │
│ │ ║ (-) COSTO DE VENTAS €18,500 ║ │ │
│ │ ║ (=) UTILIDAD BRUTA €26,730 ║ │ │
│ │ ║ (-) GASTOS OPERATIVOS €12,450 ║ │ │
│ │ ║ Alquiler €3,000 ║ │ │
│ │ ║ Servicios (luz, internet) €1,200 ║ │ │
│ │ ║ Nómina €6,500 ║ │ │
│ │ ║ Otros €1,750 ║ │ │
│ │ ║ (=) UTILIDAD OPERATIVA €14,280 ║ │ │
│ │ ║ (-) IMPUESTOS €2,500 ║ │ │
│ │ ║ (=) UTILIDAD NETA €11,780 ║ │ │
│ │ ╚═══════════════════════════════════════════════════╝ │ │
│ │ Margen Bruto: 59.1% │ Margen Neto: 26.0% │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🌊 FLUJO DE CAJA │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ╔═══════════════════════════════════════════════════╗ │ │
│ │ ║ (+) ENTRADAS €35,450 ║ │ │
│ │ ║ Ventas efectivo €28,200 ║ │ │
│ │ ║ Pagos de clientes €7,250 ║ │ │
│ │ ║ (-) SALIDAS €22,300 ║ │ │
│ │ ║ Pagos proveedores €15,000 ║ │ │
│ │ ║ Gastos operativos €7,300 ║ │ │
│ │ ║ Compras inventario €0 ║ │ │
│ │ ║ (=) FLUJO NETO €13,150 ║ │ │
│ │ ╚═══════════════════════════════════════════════════╝ │ │
│ │ Saldo Inicial: €8,500 │ Saldo Final: €21,650 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 AGING REPORT (Cartera de Clientes) │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 0-30 días: €4,200 (49.7%) ████████████░░░░ │ │
│ │ 30-60 días: €2,100 (24.9%) ██████░░░░░░░░░░ │ │
│ │ 60-90 días: €1,275 (15.1%) ████░░░░░░░░░░░ │ │
│ │ 90+ días: €875 (10.4%) ██░░░░░░░░░░░░░ │ │
│ │ ────────────────────────────────────────────────── │ │
│ │ Total: €8,450 Vencido: €2,150 (25.4%) │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ [📊 Balance General] [📦 Rentabilidad por Producto] [🏢 Proveedores]│
│ │
└─────────────────────────────────────────────────────────────────┘

````

* * *

## 7\. 🔐 SEGURIDAD Y PERMISOS FINANCIEROS

### 7.1 Matriz de Permisos por Rol (Actualizada)

| Módulo / Funcionalidad | Administrador | Vendedor | Técnico |
| --- | --- | --- | --- | --- |
| **CUENTAS POR COBRAR** |
 |
 |
 |
 |
| Ver lista de cuentas | ✅ | ✅ (suyas) | ❌ | ✅ |
| Ver detalle de cuenta | ✅ | ✅ (suyas) | ❌ | ✅ |
| Registrar abonos | ✅ | ✅ | ❌ | ✅ |
| Aplicar descuentos | ✅ | ❌ | ❌ | ✅ |
| Ver aging report | ✅ | ❌ | ❌ | ✅ |
| Bloquear/desbloquear cliente | ✅ | ❌ | ❌ | ✅ |
| **CUENTAS POR PAGAR** |
 |
 |
 |
 |
| Ver lista de cuentas | ✅ | ❌ | ❌ | ✅ |
| Ver detalle de cuenta | ✅ | ❌ | ❌ | ✅ |
| Registrar pagos | ✅ | ❌ | ❌ | ✅ |
| Aprobar pagos | ✅ | ❌ | ❌ | ✅ |
| Ver reporte proveedores | ✅ | ❌ | ❌ | ✅ |
| **CONTROL DE CAJA** |
 |
 |
 |
 |
| Abrir caja | ✅ | ✅ | ❌ | ✅ |
| Cerrar caja | ✅ | ✅ | ❌ | ✅ |
| Ver movimientos de caja | ✅ | ✅ (suyos) | ❌ | ✅ |
| Registrar gastos caja chica | ✅ | ✅ | ❌ | ✅ |
| Ver reportes de turno | ✅ | ✅ (suyos) | ❌ | ✅ |
| Aprobar diferencias | ✅ | ❌ | ❌ | ✅ |
| **GASTOS OPERATIVOS** |
 |
 |
 |
 |
| Registrar gastos | ✅ | ✅ | ❌ | ✅ |
| Ver lista de gastos | ✅ | ❌ | ❌ | ✅ |
| Aprobar gastos | ✅ | ❌ | ❌ | ✅ |
| Ver reporte de gastos | ✅ | ❌ | ❌ | ✅ |
| Administrar categorías | ✅ | ❌ | ❌ | ✅ |
| **FACTURACIÓN FISCAL** |
 |
 |
 |
 |
| Emitir facturas | ✅ | ✅ | ❌ | ✅ |
| Anular facturas | ✅ | ❌ | ❌ | ✅ |
| Emitir notas crédito/débito | ✅ | ❌ | ❌ | ✅ |
| Ver documentos fiscales | ✅ | ✅ (suyas) | ❌ | ✅ |
| Configurar series | ✅ | ❌ | ❌ | ✅ |
| Enviar a autoridad tributaria | ✅ | ❌ | ❌ | ✅ |
| **GESTIÓN DE CRÉDITOS** |
 |
 |
 |
 |
| Asignar límites de crédito | ✅ | ❌ | ❌ | ✅ |
| Modificar límites | ✅ | ❌ | ❌ | ✅ |
| Ver historial de crédito | ✅ | ✅ (suyos) | ❌ | ✅ |
| Ver score de crédito | ✅ | ✅ (suyo) | ❌ | ✅ |
| Bloquear/desbloquear crédito | ✅ | ❌ | ❌ | ✅ |
| **REPORTES FINANCIEROS** |
 |
 |
 |
 |
| Ver estado de resultados | ✅ | ❌ | ❌ | ✅ |
| Ver balance general | ✅ | ❌ | ❌ | ✅ |
| Ver flujo de caja | ✅ | ❌ | ❌ | ✅ |
| Ver aging report | ✅ | ❌ | ❌ | ✅ |
| Ver reporte de proveedores | ✅ | ❌ | ❌ | ✅ |
| Ver rentabilidad por producto | ✅ | ❌ | ❌ | ✅ |
| Exportar reportes | ✅ | ❌ | ❌ | ✅ |

### 7.2 Auditoría Financiera

**Logs de Auditoría Específicos:**

```sql
-- Tabla de auditoría financiera (extensión de audit_logs)
CREATE TABLE financial_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,  -- 'payment', 'credit_adjustment', 'expense', etc.
    entity_type VARCHAR(50) NOT NULL,   -- 'accounts_receivable', 'expense', etc.
    entity_id INTEGER,

    -- Detalles del cambio
    old_values JSONB,
    new_values JSONB,

    -- Contexto
    ip_address INET,
    user_agent TEXT,
    reason TEXT,

    -- Aprobación (si requiere)
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fal_user ON financial_audit_logs(user_id);
CREATE INDEX idx_fal_entity ON financial_audit_logs(entity_type, entity_id);
CREATE INDEX idx_fal_date ON financial_audit_logs(created_at);
````

**Acciones Auditadas:**

- Todos los pagos (clientes y proveedores)
- Ajustes de crédito
- Creación/anulación de facturas fiscales
- Apertura/cierre de caja
- Registro de gastos
- Modificaciones de límites de crédito
- Bloqueos/desbloqueos de cuentas

---

## 8\. 🛠️ STACK TECNOLÓGICO

### 8.1 Stack Principal

**Backend (FastAPI + Python 3.11+)**

- Framework: FastAPI 0.104+
- ORM: SQLAlchemy 2.0+ con async
- Database: PostgreSQL 15+
- Auth: OAuth2 + JWT (python-jose)
- Validation: Pydantic v2
- Background Tasks: Celery + Redis
- API Docs: Swagger UI / ReDoc

**Frontend (React 18 + TypeScript)**

- Core: Next.js 14+ (App Router) + Tailwind CSS
- UI Library: Tailwind CSS
- State Management: Zustand
- Data Fetching: TanStack Query (React Query)
- Forms: React Hook Form + Zod
- Routing: React Router v6
- Charts: Recharts
- HTTP Client: Axios
- Date Handling: date-fns

**Infraestructura:**

- Version Control: Git + GitHub
- CI/CD: GitHub Actions
- Containerization: Docker
- Database: PostgreSQL (AWS RDS / Railway)
- Backend Hosting: AWS EC2 / DigitalOcean / Railway
- Frontend Hosting: Vercel / Netlify
- File Storage: AWS S3 (para facturas PDF)

### Estructura de Proyecto Corregida

serviceflow/
├── backend/ # ← Backend claramente separado
│ └── src/
│ ├── models/ # Modelos SQLAlchemy
│ ├── schemas/ # Esquemas Pydantic
│ ├── api/
│ ├── core/
│ │ ├── database.py
│ │ └── config.py
│ └── main.py # ← Punto de entrada explícito
│ ├── Dockerfile
│ └── requirements.txt
├── frontend/ # (Fase 2+)
├── database/
├── docker-compose.yml
└── README.md

### 8.2 Herramientas Financieras Adicionales

**Librerías Python (Backend):**

```python
# Manejo de dinero y decimales
from decimal import Decimal, getcontext
getcontext().prec = 4  # 4 decimales para cálculos financieros

# Cálculo de fechas
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# Generación de PDFs
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

# Exportación a Excel
import pandas as pd
from openpyxl import Workbook

# Formato de moneda
import locale
locale.setlocale(locale.LC_ALL, 'es_ES.UTF-8')
```

**Librerías JavaScript (Frontend):**

```javascript
// Formato de moneda
import { formatCurrency } from "@/utils/format";
// formatCurrency(1234.56) → "1.234,56 €"

// Formato de fechas
import { format } from "date-fns";
import { es } from "date-fns/locale";
// format(date, 'dd/MM/yyyy', { locale: es })

// Cálculos financieros
import { calculateInterest, calculateAging } from "@/utils/financial";
```

---

## 9\. 📋 ROADMAP DE IMPLEMENTACIÓN

### 9.1 Fase 1: Núcleo Operativo (4-6 semanas)

**Objetivo:** Que la tienda pueda operar y generar tickets

**Módulos:**

- ✅ Gestión de Usuarios y Roles
- ✅ Gestión de Clientes (CRM)
- ✅ Gestión de Productos e Inventario
- ✅ Punto de Venta (POS)
- ✅ Gestión de Órdenes de Reparación
- ✅ Dashboard básico

**Entregables:**

- Sistema operativo funcional
- Registro de ventas y reparaciones
- Control de inventario básico
- Gestión de clientes
- 3 roles de usuario (Admin, Vendedor, Técnico)

**Métricas de Éxito:**

- Tienda operando 100% con el sistema
- 0 tickets manuales
- Inventario sincronizado

### 9.2 Fase 2: Gestión Financiera Básica (6-8 semanas)

**Objetivo:** Control de cuentas por cobrar y caja

**Módulos:**

- ✅ Cuentas por Cobrar (Accounts Receivable)
- ✅ Sistema de Abonos Parciales
- ✅ Control de Caja (Apertura/Cierre)
- ✅ Gestión de Créditos Básica
- ✅ Aging Report Básico

**Entregables:**

- Cartera de clientes funcional
- Sistema de abonos parciales
- Control de caja completo
- Reportes básicos de cartera

**Métricas de Éxito:**

- 100% de ventas a crédito controladas
- Cierre de caja diario implementado
- Aging report generando automáticamente

### 9.3 Fase 3: Gestión de Proveedores y Compras (4-6 semanas)

**Objetivo:** Control de compras y cuentas por pagar

**Módulos:**

- ✅ Gestión de Proveedores
- ✅ Órdenes de Compra
- ✅ Recepción de Mercancía
- ✅ Cuentas por Pagar (Accounts Payable)
- ✅ Reportes de Proveedores

**Entregables:**

- Catálogo de proveedores
- Flujo completo de compras
- Cuentas por pagar controladas
- Reportes de proveedores

**Métricas de Éxito:**

- 100% de compras registradas
- Inventario actualizado en recepciones
- Cuentas por pagar bajo control

### 9.4 Fase 4: Gastos Operativos y Facturación Fiscal (6-8 semanas)

**Objetivo:** Control de gastos y compliance fiscal

**Módulos:**

- ✅ Gastos Operativos
- ✅ Categorías de Gastos
- ✅ Facturación Fiscal
- ✅ Retenciones de Impuestos
- ✅ Notas de Crédito/Débito

**Entregables:**

- Sistema de gastos operativos
- Facturación fiscal completa
- Retenciones configuradas
- Compliance fiscal del país

**Métricas de Éxito:**

- 100% de gastos registrados
- Facturación fiscal al día
- Retenciones calculadas correctamente

### 9.5 Fase 5: Reportes e Inteligencia Financiera (4-6 semanas)

**Objetivo:** Análisis completo del negocio

**Módulos:**

- ✅ Estado de Resultados (P&L)
- ✅ Balance General
- ✅ Flujo de Caja (Cash Flow)
- ✅ Reporte de Rentabilidad
- ✅ Dashboard Financiero Ejecutivo

**Entregables:**

- Reportes financieros completos
- Dashboard financiero con KPIs
- Exportación a Excel/PDF
- Análisis de tendencias

**Métricas de Éxito:**

- Reportes generados en < 10 segundos
- KPIs actualizados en tiempo real
- Decisiones basadas en datos

### 9.6 Fase 6: Automatización e Integraciones (4-6 semanas)

**Objetivo:** Optimización y expansiones

**Módulos:**

- ✅ Notificaciones Automáticas (WhatsApp/Email)
- ✅ Integración con Autoridad Tributaria
- ✅ Backup Estratégico
- ✅ Escalado de Infraestructura
- ✅ Optimización de Rendimiento

**Entregables:**

- Notificaciones automáticas funcionando
- Integración fiscal completa
- Backup y restore probados
- Sistema optimizado

**Métricas de Éxito:**

- Tiempo de respuesta < 2 segundos
- 99.9% uptime
- Backup diario automatizado

### 9.7 Resumen del Roadmap

| Fase   | Duración    | Módulos           | Riesgo | Dependencias     |
| ------ | ----------- | ----------------- | ------ | ---------------- |
| Fase 1 | 4-6 semanas | Operacional       | Bajo   | Ninguna          |
| Fase 2 | 6-8 semanas | Financiero Básico | Medio  | Fase 1           |
| Fase 3 | 4-6 semanas | Proveedores       | Medio  | Fase 1           |
| Fase 4 | 6-8 semanas | Gastos/Fiscal     | Alto   | Fase 2, 3        |
| Fase 5 | 4-6 semanas | Reportes          | Bajo   | Fase 2, 3, 4     |
| Fase 6 | 4-6 semanas | Automatización    | Medio  | Todas anteriores |

**Tiempo Total Estimado: 28-40 semanas (7-10 meses)**

---

## 10\. ✅ CONCLUSIÓN

Serviceflow Pro ERP es ahora un **sistema completo de gestión empresarial** para tiendas de telefonía móvil, con capacidades operativas, financieras, contables y fiscales profesionales.

### Resumen Final

**Total de Tablas:** 28 (13 operacionales + 15 financieras)  
**Total de Módulos:** 15 (8 operacionales + 7 financieros)  
**Total de Permisos:** 105+ (60 operacionales + 45 financieros)  
**Roles de Usuario:** 4 (Administrador, Vendedor, Técnico)

### Capacidades del Sistema

✅ **Gestión Operacional**

- Ventas y Punto de Venta (POS)
- Reparaciones técnicas
- Inventario y stock
- Gestión de clientes (CRM)

✅ **Gestión Financiera**

- Cuentas por cobrar (cartera de clientes)
- Cuentas por pagar (proveedores)
- Control de caja (apertura/cierre)
- Gestión de créditos y límites
- Sistema de abonos parciales
- Reporte de antigüedad (Aging)

✅ **Gestión de Proveedores**

- Catálogo de proveedores
- Órdenes de compra
- Recepción de mercancía
- Facturación de proveedores

✅ **Gastos Operativos**

- Registro de gastos
- Categorización
- Aprobación de gastos
- Control de presupuesto

✅ **Facturación Fiscal**

- Emisión de facturas
- Cálculo de impuestos
- Retenciones
- Notas de crédito/débito
- Compliance fiscal

✅ **Reportes Financieros**

- Estado de Resultados (P&L)
- Balance General
- Flujo de Caja (Cash Flow)
- Rentabilidad por producto
- Aging Report
- Reportes de proveedores

✅ **Seguridad y Auditoría**

- Autenticación JWT
- Permisos granulares por rol
- Auditoría financiera completa
- Encriptación de datos sensibles

### Estado Actual

El sistema está **LISTO PARA IMPLEMENTACIÓN** como un ERP completo. La arquitectura está diseñada para ser:

- **Escalable**: Preparado para crecer con el negocio
- **Seguro**: Múltiples capas de protección
- **Mantenible**: Código limpio y bien documentado
- **Flexible**: Adaptable a diferentes países y normativas
- **Profesional**: Cumple con estándares empresariales

### Próximos Pasos Recomendados

1.  **Validación de Requisitos**: Revisar con el cliente todos los módulos
2.  **Priorización**: Definir qué fases son críticas vs. deseables
3.  **Planificación de Recursos**: Asignar equipo de desarrollo
4.  **Inicio de Desarrollo**: Comenzar con Fase 1 (Núcleo Operativo)
5.  **Testing Continuo**: Implementar pruebas en cada fase
6.  **Capacitación**: Preparar material de capacitación para usuarios
7.  **Migración de Datos**: Planificar migración desde sistema actual
8.  **Rollout**: Implementación por fases con soporte

---

**Documentación Creada Por**: SuperNinja AI Agent  
**Fecha**: 2025-01-03  
**Versión**: 2.0.0 - ERP Completo  
**Estado**: ✅ Listo para Implementación

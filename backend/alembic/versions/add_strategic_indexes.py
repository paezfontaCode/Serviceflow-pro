"""Add strategic indexes for performance optimization

Revision ID: add_strategic_indexes
Revises: previous_revision
Create Date: 2024-01-15

Este script agrega índices estratégicos para mejorar el rendimiento de consultas
frecuentes en las tablas principales del sistema.

Impacto en Performance:
- sales: Índices para filtrado por fecha, estado y sucursal (consultas de reportes)
- repairs: Índices para búsqueda por estado, fecha y cliente (seguimiento de reparaciones)
- inventory: Índice único en SKU para validaciones rápidas, índices por sucursal y estado
- abonos: Índices para consultas de pagos por venta y por fecha
- accounts_receivable: Índices para gestión de cuentas por cobrar (vencimientos y estado)

Los índices reducen el tiempo de consulta de O(n) a O(log n) para operaciones de:
- Búsqueda por status en ventas y reparaciones
- Ordenamiento por fecha de creación
- Filtrado por sucursal en inventario
- Búsqueda de abonos por venta
- Consultas de cuentas por vencer o vencidas
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_strategic_indexes'
down_revision = None  # Cambiar al hash de la migración anterior
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Agrega índices estratégicos para optimizar consultas frecuentes.
    
    Los índices están diseñados para:
    1. Acelerar filtros comunes (status, branch_id, customer_id)
    2. Optimizar ordenamientos por fecha (created_at, due_date)
    3. Garantizar unicidad donde sea necesario (sku)
    """
    
    # ============================================
    # TABLA: sales
    # ============================================
    # Índice en created_at DESC para consultas de historial ordenadas por fecha
    # Esto evita el sort en memoria para queries como:
    # SELECT * FROM sales ORDER BY created_at DESC LIMIT 100
    op.create_index(
        op.f('ix_sales_created_at'),
        'sales',
        ['created_at'],
        unique=False,
        postgresql_ops={'created_at': 'DESC'}
    )
    
    # Índice en status para filtrado rápido por estado de venta
    # Útil para: pending, completed, cancelled, etc.
    op.create_index(
        op.f('ix_sales_status'),
        'sales',
        ['status'],
        unique=False
    )
    
    # Índice en branch_id para filtrado por sucursal
    # Esencial para reportes por ubicación y multi-tenant
    op.create_index(
        op.f('ix_sales_branch_id'),
        'sales',
        ['branch_id'],
        unique=False
    )
    
    # ============================================
    # TABLA: repairs
    # ============================================
    # Índice en status para seguimiento de estado de reparaciones
    # Permite filtrar rápidamente: in_progress, ready, delivered, etc.
    op.create_index(
        op.f('ix_repairs_status'),
        'repairs',
        ['status'],
        unique=False
    )
    
    # Índice en created_at para ordenamiento cronológico
    # Usado en listados de reparaciones por fecha de ingreso
    op.create_index(
        op.f('ix_repairs_created_at'),
        'repairs',
        ['created_at'],
        unique=False
    )
    
    # Índice en customer_id para búsqueda de historial por cliente
    # Crítico para: SELECT * FROM repairs WHERE customer_id = ?
    op.create_index(
        op.f('ix_repairs_customer_id'),
        'repairs',
        ['customer_id'],
        unique=False
    )
    
    # ============================================
    # TABLA: inventory
    # ============================================
    # Índice UNIQUE en sku para validación rápida de duplicados
    # Previene inserciones duplicadas y acelera lookups por SKU
    op.create_index(
        op.f('ix_inventory_sku'),
        'inventory',
        ['sku'],
        unique=True
    )
    
    # Índice en branch_id para inventario por sucursal
    # Usado en consultas de stock localizado
    op.create_index(
        op.f('ix_inventory_branch_id'),
        'inventory',
        ['branch_id'],
        unique=False
    )
    
    # Índice en status para filtrado por estado de inventario
    # Útil para: active, discontinued, low_stock, out_of_stock
    op.create_index(
        op.f('ix_inventory_status'),
        'inventory',
        ['status'],
        unique=False
    )
    
    # ============================================
    # TABLA: abonos (pagos parciales)
    # ============================================
    # Índice en sale_id para buscar todos los abonos de una venta
    # Esencial para calcular saldo pendiente: SELECT SUM(amount) FROM abonos WHERE sale_id = ?
    op.create_index(
        op.f('ix_abonos_sale_id'),
        'abonos',
        ['sale_id'],
        unique=False
    )
    
    # Índice en created_at para historial de pagos por fecha
    # Usado en reportes de ingresos y arqueos de caja
    op.create_index(
        op.f('ix_abonos_created_at'),
        'abonos',
        ['created_at'],
        unique=False
    )
    
    # ============================================
    # TABLA: accounts_receivable (cuentas por cobrar)
    # ============================================
    # Índice en customer_id para cuentas por cobrar por cliente
    # Crítico para estados de cuenta y límites de crédito
    op.create_index(
        op.f('ix_accounts_receivable_customer_id'),
        'accounts_receivable',
        ['customer_id'],
        unique=False
    )
    
    # Índice en due_date para gestión de vencimientos
    # Permite consultas eficientes de cuentas próximas a vencer o vencidas:
    # SELECT * FROM accounts_receivable WHERE due_date <= ?
    op.create_index(
        op.f('ix_accounts_receivable_due_date'),
        'accounts_receivable',
        ['due_date'],
        unique=False
    )
    
    # Índice en status para filtrado por estado de cuenta
    # Útil para: pending, paid, overdue, cancelled
    op.create_index(
        op.f('ix_accounts_receivable_status'),
        'accounts_receivable',
        ['status'],
        unique=False
    )


def downgrade() -> None:
    """
    Elimina todos los índices creados en upgrade().
    
    Esta operación es reversible y segura de ejecutar en caso de necesitar
    rollback. Los índices pueden eliminarse sin pérdida de datos.
    """
    
    # ============================================
    # TABLA: accounts_receivable
    # ============================================
    op.drop_index(op.f('ix_accounts_receivable_status'), table_name='accounts_receivable')
    op.drop_index(op.f('ix_accounts_receivable_due_date'), table_name='accounts_receivable')
    op.drop_index(op.f('ix_accounts_receivable_customer_id'), table_name='accounts_receivable')
    
    # ============================================
    # TABLA: abonos
    # ============================================
    op.drop_index(op.f('ix_abonos_created_at'), table_name='abonos')
    op.drop_index(op.f('ix_abonos_sale_id'), table_name='abonos')
    
    # ============================================
    # TABLA: inventory
    # ============================================
    op.drop_index(op.f('ix_inventory_status'), table_name='inventory')
    op.drop_index(op.f('ix_inventory_branch_id'), table_name='inventory')
    op.drop_index(op.f('ix_inventory_sku'), table_name='inventory')
    
    # ============================================
    # TABLA: repairs
    # ============================================
    op.drop_index(op.f('ix_repairs_customer_id'), table_name='repairs')
    op.drop_index(op.f('ix_repairs_created_at'), table_name='repairs')
    op.drop_index(op.f('ix_repairs_status'), table_name='repairs')
    
    # ============================================
    # TABLA: sales
    # ============================================
    op.drop_index(op.f('ix_sales_branch_id'), table_name='sales')
    op.drop_index(op.f('ix_sales_status'), table_name='sales')
    op.drop_index(op.f('ix_sales_created_at'), table_name='sales')

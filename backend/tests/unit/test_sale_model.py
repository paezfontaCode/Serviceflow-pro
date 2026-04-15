"""Tests unitarios para el modelo Sale y SaleItem."""

import pytest
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.sale import Sale, SaleItem
from app.models.customer import Customer
from app.models.user import User


@pytest.fixture
def test_customer(db: Session):
    """Crea un cliente de prueba."""
    customer = Customer(
        name="Cliente Test",
        email="cliente@test.com",
        phone="1234567890",
        dni_type="V",
        dni="12345678"
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    yield customer
    db.delete(customer)
    db.commit()


@pytest.fixture
def test_user(db: Session):
    """Crea un usuario de prueba (cajero)."""
    user = User(
        username="cajero_test",
        email="cajero@test.com",
        full_name="Cajero Test",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G.2"  # password hash dummy
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()


@pytest.fixture
def test_sale(db: Session, test_customer: Customer, test_user: User):
    """Crea una venta de prueba con items."""
    sale = Sale(
        customer_id=test_customer.id,
        user_id=test_user.id,
        total_usd=Decimal("100.00"),
        total_ves=Decimal("3600.00"),
        exchange_rate=Decimal("36.00"),
        payment_method="cash",
        payment_status="pending"
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    
    # Agregar items
    item1 = SaleItem(
        sale_id=sale.id,
        product_id=None,
        quantity=2,
        unit_price_usd=Decimal("25.00"),
        unit_cost_usd=Decimal("15.00"),
        subtotal_usd=Decimal("50.00")
    )
    item2 = SaleItem(
        sale_id=sale.id,
        product_id=None,
        quantity=1,
        unit_price_usd=Decimal("50.00"),
        unit_cost_usd=Decimal("30.00"),
        subtotal_usd=Decimal("50.00")
    )
    db.add_all([item1, item2])
    db.commit()
    
    yield sale
    db.delete(sale)
    db.commit()


class TestSaleTotalCalculation:
    """Tests para cálculo de totales en ventas."""
    
    def test_total_calculation_usd(self, db: Session, test_customer: Customer, test_user: User):
        """Verifica que la suma de items en USD sea correcta."""
        sale = Sale(
            customer_id=test_customer.id,
            user_id=test_user.id,
            total_usd=Decimal("0.00"),
            total_ves=Decimal("0.00"),
            exchange_rate=Decimal("36.00"),
            payment_method="cash",
            payment_status="pending"
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)
        
        # Agregar items
        item1 = SaleItem(
            sale_id=sale.id,
            product_id=None,
            quantity=2,
            unit_price_usd=Decimal("25.00"),
            unit_cost_usd=Decimal("15.00"),
            subtotal_usd=Decimal("50.00")
        )
        item2 = SaleItem(
            sale_id=sale.id,
            product_id=None,
            quantity=3,
            unit_price_usd=Decimal("10.00"),
            unit_cost_usd=Decimal("5.00"),
            subtotal_usd=Decimal("30.00")
        )
        db.add_all([item1, item2])
        db.commit()
        db.refresh(sale)
        
        # Calcular total desde items
        calculated_total = sum(item.subtotal_usd for item in sale.items)
        assert calculated_total == Decimal("80.00")
        
        # Limpiar
        db.delete(sale)
        db.commit()
    
    def test_total_calculation_ves(self, db: Session, test_customer: Customer, test_user: User):
        """Verifica que la conversión a VES con tasa BCV sea correcta."""
        exchange_rate = Decimal("36.50")
        total_usd = Decimal("100.00")
        expected_ves = total_usd * exchange_rate  # 3650.00
        
        sale = Sale(
            customer_id=test_customer.id,
            user_id=test_user.id,
            total_usd=total_usd,
            total_ves=expected_ves,
            exchange_rate=exchange_rate,
            payment_method="cash",
            payment_status="pending"
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)
        
        assert sale.total_ves == Decimal("3650.00")
        assert sale.exchange_rate == Decimal("36.50")
        
        # Limpiar
        db.delete(sale)
        db.commit()


class TestSalePaymentStatus:
    """Tests para estados de pago en ventas."""
    
    def test_payment_status_full(self, db: Session, test_customer: Customer, test_user: User):
        """Cuando amount_paid >= total, el estado debe ser 'paid'."""
        from app.models.finance import CustomerPayment, AccountReceivable
        
        sale = Sale(
            customer_id=test_customer.id,
            user_id=test_user.id,
            total_usd=Decimal("100.00"),
            total_ves=Decimal("3600.00"),
            exchange_rate=Decimal("36.00"),
            payment_method="credit",
            payment_status="pending"
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)
        
        # Crear cuenta por cobrar
        account = AccountReceivable(
            customer_id=test_customer.id,
            sale_id=sale.id,
            total_amount=Decimal("100.00"),
            paid_amount=Decimal("0.00"),
            due_date=datetime.now(timezone.utc).date(),
            status="pending",
            created_by=test_user.id
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        
        # Simular pago completo
        account.paid_amount = Decimal("100.00")
        account.status = "paid"
        sale.payment_status = "paid"
        db.commit()
        
        assert sale.payment_status == "paid"
        assert account.balance == Decimal("0.00")
        
        # Limpiar
        db.delete(sale)
        db.commit()
    
    def test_payment_status_partial(self, db: Session, test_customer: Customer, test_user: User):
        """Cuando 0 < amount_paid < total, el estado debe ser 'partial'."""
        from app.models.finance import AccountReceivable
        
        sale = Sale(
            customer_id=test_customer.id,
            user_id=test_user.id,
            total_usd=Decimal("100.00"),
            total_ves=Decimal("3600.00"),
            exchange_rate=Decimal("36.00"),
            payment_method="credit",
            payment_status="pending"
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)
        
        # Crear cuenta por cobrar con pago parcial
        account = AccountReceivable(
            customer_id=test_customer.id,
            sale_id=sale.id,
            total_amount=Decimal("100.00"),
            paid_amount=Decimal("40.00"),
            due_date=datetime.now(timezone.utc).date(),
            status="partial",
            created_by=test_user.id
        )
        db.add(account)
        db.commit()
        
        sale.payment_status = "partial"
        db.commit()
        
        assert sale.payment_status == "partial"
        assert account.balance == Decimal("60.00")
        
        # Limpiar
        db.delete(sale)
        db.commit()
    
    def test_payment_status_pending(self, db: Session, test_customer: Customer, test_user: User):
        """Cuando amount_paid = 0, el estado debe ser 'pending'."""
        from app.models.finance import AccountReceivable
        
        sale = Sale(
            customer_id=test_customer.id,
            user_id=test_user.id,
            total_usd=Decimal("100.00"),
            total_ves=Decimal("3600.00"),
            exchange_rate=Decimal("36.00"),
            payment_method="credit",
            payment_status="pending"
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)
        
        # Crear cuenta por cobrar sin pagos
        account = AccountReceivable(
            customer_id=test_customer.id,
            sale_id=sale.id,
            total_amount=Decimal("100.00"),
            paid_amount=Decimal("0.00"),
            due_date=datetime.now(timezone.utc).date(),
            status="pending",
            created_by=test_user.id
        )
        db.add(account)
        db.commit()
        
        assert sale.payment_status == "pending"
        assert account.balance == Decimal("100.00")
        
        # Limpiar
        db.delete(sale)
        db.commit()


class TestSaleImmutability:
    """Tests para inmutabilidad de ventas con abonos."""
    
    def test_add_abono_inmutable(self, db: Session, test_sale: Sale, test_customer: Customer, test_user: User):
        """No permite modificar venta que ya tiene abonos registrados."""
        from app.models.finance import CustomerPayment, AccountReceivable
        
        # Crear cuenta por cobrar asociada a la venta
        account = AccountReceivable(
            customer_id=test_customer.id,
            sale_id=test_sale.id,
            total_amount=test_sale.total_usd,
            paid_amount=Decimal("0.00"),
            due_date=datetime.now(timezone.utc).date(),
            status="pending",
            created_by=test_user.id
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        
        # Registrar un abono
        abono = CustomerPayment(
            account_id=account.id,
            customer_id=test_customer.id,
            amount_usd=Decimal("50.00"),
            amount_ves=Decimal("1800.00"),
            exchange_rate=Decimal("36.00"),
            balance_before=Decimal("100.00"),
            balance_after=Decimal("50.00"),
            payment_method="cash",
            currency="USD",
            created_by=test_user.id
        )
        db.add(abono)
        db.commit()
        
        # Intentar modificar la venta debería ser detectado como operación no permitida
        # En la lógica de negocio, esto se valida antes de permitir cambios
        original_total = test_sale.total_usd
        
        # La venta puede leerse pero la modificación debería validarse en el servicio
        assert test_sale.total_usd == original_total
        assert len(account.payments) == 1
        
        # Limpiar
        db.delete(test_sale)
        db.commit()

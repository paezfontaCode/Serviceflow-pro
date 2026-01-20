# ServiceFlow Pro 2.0 🚀

> **Sistema ERP Premium para Gestión de Ventas y Servicios Técnicos.**
> Diseñado para la realidad económica de Venezuela, integrando facturación dual (USD/VES), pagos parciales y gestión de inventario omnicanal.

---

## 🌟 Pilares de la Plataforma

### 1. Venta Omnicanal (Omnichannel POS)

El Punto de Venta unifica el mundo físico y digital. Permite a los vendedores buscar simultáneamente productos en inventario y órdenes de servicio listas para entrega, permitiendo transacciones mixtas en un solo carrito.

### 2. Realidad Financiera Dual

Sincronización automática con la tasa oficial (BCV). Los cálculos se realizan en tiempo real permitiendo pagos mixtos, abonos parciales y seguimiento de deuda vinculada a la cuenta corriente del cliente.

### 3. Glassmorphism UI

Interfaz de alta fidelidad con efectos de desenfoque, bordes translúcidos y animaciones suaves que proporcionan una experiencia de usuario premium y profesional.

---

## 🛠️ Stack Tecnológico

### Backend (FastAPI Core)

- **Framework:** FastAPI (Python 3.10+)
- **ORM:** SQLAlchemy con soporte para PostgreSQL/SQLite.
- **Validación:** Pydantic V2.
- **Seguridad:** Autenticación JWT y Permission Guards.
- **Finanzas:** Decimal Precision para cálculos monetarios exactos.

### Frontend (React + TS)

- **Framework:** React 18 + Vite.
- **Lenguaje:** TypeScript (Strict Mode).
- **Estilos:** Tailwind CSS (Vanilla CSS para componentes complejos).
- **Estado:** Zustand (Store persistente).
- **Consultas:** TanStack Query (React Query) para sincronización con servidor.
- **Iconografía:** Lucide React.

---

## 📂 Estructura del Proyecto

### Backend (`/backend`)

```text
app/
├── api/v1/         # Endpoints (sales, repairs, inventory, auth, finance)
├── models/         # Modelos SQLAlchemy (Sale, Repair, Customer, etc.)
├── schemas/        # Esquemas Pydantic para validación de datos
├── core/           # Configuración base, DB y seguridad
├── services/       # Lógica de negocio pesada
└── main.py         # Punto de entrada de la aplicación
```

### Frontend (`/frontend`)

```text
src/
├── pages/          # Vistas principales (POS, Repairs, Dashboard, Reports)
├── components/     # UI reusable (Modals, Shimmers, Guards)
├── store/          # Manejo de estado (Cart, Auth, ExchangeRate)
├── services/       # Clientes API con Axios
├── layouts/        # Estructuras de navegación (Sidebar, Layout)
└── utils/          # Formateadores monetarios y helpers
```

---

## 🚀 Instalación y Ejecución

### Scripts Automatizados (Windows)

En la raíz del proyecto, ejecuta el script de inicio rápido:

```powershell
./run_project.ps1
```

### Ejecución Manual

#### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Características Clave Implementadas

- [x] **Búsqueda Omnicanal:** Consulta unificada de SKU y # de Orden.
- [x] **Cuentas por Cobrar:** Registro automático de abonos y saldos pendientes.
- [x] **Gestión de Stock:** Bloqueo de stock en base de datos (`SELECT FOR UPDATE`).
- [x] **Tickets Térmicos:** Generación dinámica de tickets HTML para impresión.
- [x] **Dashboard Analítico:** KPIs de ventas y métricas de servicios en tiempo real.

---

## 📜 Licencia

Propiedad de **ServiceFlow Pro**. Todos los derechos reservados.

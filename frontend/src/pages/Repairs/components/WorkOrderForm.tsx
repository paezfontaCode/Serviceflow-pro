import { useState, useEffect } from 'react';
import { X, Save, Wrench, Loader2, Monitor, Cpu, ClipboardCheck, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repairService, WorkOrderRead } from '@/services/api/repairService';
import { customerService, CustomerRead } from '@/services/api/customerService';
import { toast } from 'sonner';
import CustomerQuickModal from '@/components/CustomerQuickModal';
import { ProductRead, WorkOrderCreate } from '@/types/api';
import InventoryPartPicker from './InventoryPartPicker';
import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { ticketService } from '@/services/ticketService';
import { formatVES, formatUSD } from '@/utils/currency';

interface WorkOrderFormProps {
    isOpen: boolean;
    onClose: () => void;
    order?: WorkOrderRead;
}

const SERVICE_TYPES = [
    { id: 'SOFTWARE', label: 'Software', icon: Monitor, color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' },
    { id: 'HARDWARE', label: 'Hardware', icon: Cpu, color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
    { id: 'REVISION', label: 'Revisión', icon: ClipboardCheck, color: 'text-slate-300 border-slate-500/20 bg-slate-500/10' },
] as const;

const QUICK_ACTIONS = [
    { id: 'PIN_V8', label: 'Pin V8', search: 'Pin' },
    { id: 'PIN_TYPE_C', label: 'Pin Tipo C', search: 'Pin' },
    { id: 'SCREEN', label: 'Pantalla', search: 'Pantalla' },
    { id: 'BATTERY', label: 'Batería', search: 'Bateria' },
];

const FEATURED_BRANDS = [
    'Apple', 'Google', 'OnePlus', 'Oppo', 'POCO', 'realme', 'Samsung', 'vivo', 'Xiaomi', 'Tecno', 'Infinix'
];

export default function WorkOrderForm({ isOpen, onClose, order }: WorkOrderFormProps) {
    const queryClient = useQueryClient();
    const isEdit = !!order;
    const { rate: bcvRate } = useExchangeRateStore();

    const initialState = {
        customer_id: '',
        problem_description: '',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        repair_type: 'service' as 'software' | 'hardware' | 'service',
        service_type: 'SOFTWARE' as 'SOFTWARE' | 'HARDWARE' | 'REVISION',
        quick_service_tag: '',
        brand: '',
        model: '',
        device_imei: '',
        estimated_delivery: '',
        labor_cost_usd: '0',
        missing_part_note: '',
        status: 'RECEIVED'
    };

    const [formData, setFormData] = useState(initialState);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<WorkOrderRead | null>(null);
    const [itemsToConsume, setItemsToConsume] = useState<{ product_id: number, quantity: number, name: string, price: number }[]>([]);

    // Customer selection state
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerRead | null>(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Initial search for part picker (controlled by quick actions)
    const [partPickerSearch, setPartPickerSearch] = useState('');

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getCustomers
    });

    const filteredCustomers = customers?.filter(c => {
        const searchLower = customerSearch.toLowerCase();
        return c.name?.toLowerCase().includes(searchLower) ||
            c.phone?.includes(customerSearch) ||
            c.dni?.includes(customerSearch);
    }).slice(0, 5);

    useEffect(() => {
        if (order) {
            setFormData({
                customer_id: order.customer_id.toString(),
                problem_description: order.problem_description,
                priority: order.priority as any,
                repair_type: (order.repair_type as any) || 'service',
                service_type: (order.service_type as any) || 'SERVICE',
                quick_service_tag: order.quick_service_tag || '',
                brand: order.device_model.split(' ')[0] || '',
                model: order.device_model.split(' ').slice(1).join(' ') || '',
                device_imei: order.device_imei || '',
                estimated_delivery: order.estimated_delivery ? order.estimated_delivery.split('T')[0] : '',
                labor_cost_usd: order.labor_cost_usd?.toString() || '0',
                missing_part_note: '',
                status: order.status
            });
            const customer = customers?.find(c => c.id === order.customer_id);
            if (customer) setSelectedCustomer(customer);
        }
    }, [order, isOpen, customers]);

    const mutation = useMutation({
        mutationFn: (data: WorkOrderCreate) => isEdit
            ? repairService.updateWorkOrder(order!.id, data)
            : repairService.createWorkOrder(data),
        onSuccess: (newOrder) => {
            queryClient.invalidateQueries({ queryKey: ['workOrders'] });
            toast.success(isEdit ? 'Orden actualizada' : 'Orden creada exitosamente');

            if (!isEdit && newOrder) {
                setCreatedOrder(newOrder);
                setIsSuccess(true);
            } else {
                onClose();
            }
        },
        onError: (error: any) => {
            const detail = error.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map((err: any) => err.msg).join(', ')
                : typeof detail === 'string' ? detail : 'Verifica los campos obligatorios';

            toast.error('Error al guardar la orden', {
                description: message
            });
        }
    });

    const handleCustomerSelect = (customer: CustomerRead) => {
        setSelectedCustomer(customer);
        setFormData({ ...formData, customer_id: customer.id.toString() });
        setShowCustomerDropdown(false);
        setCustomerSearch('');
    };

    const handleServiceTypeChange = (type: string) => {
        const newType = type as 'SOFTWARE' | 'HARDWARE' | 'REVISION';
        let newLabor = formData.labor_cost_usd;

        if (newType === 'REVISION') {
            newLabor = '5';
            setItemsToConsume([]);
        }

        setFormData({
            ...formData,
            service_type: newType,
            repair_type: newType === 'HARDWARE' ? 'hardware' : 'service',
            labor_cost_usd: newLabor
        });
    };

    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
        setFormData({
            ...formData,
            quick_service_tag: action.id,
            problem_description: formData.problem_description ? formData.problem_description : `Servicio: ${action.label}`
        });
        setPartPickerSearch(action.search);
        toast.info(`Filtro "${action.label}" activado en repuestos`);
    };

    const addPart = (product: ProductRead) => {
        const existing = itemsToConsume.find(i => i.product_id === product.id);
        if (existing) {
            setItemsToConsume(itemsToConsume.map(i =>
                i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setItemsToConsume([...itemsToConsume, {
                product_id: product.id,
                quantity: 1,
                name: product.name,
                price: product.price_usd
            }]);
        }
    };

    const removePart = (productId: number) => {
        setItemsToConsume(itemsToConsume.filter(i => i.product_id !== productId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customer_id) {
            toast.error('Debes seleccionar un cliente');
            return;
        }
        const payload = {
            customer_id: parseInt(formData.customer_id),
            device_model: `${formData.brand} ${formData.model}`.trim(),
            device_imei: formData.device_imei || undefined,
            problem_description: formData.problem_description,
            priority: formData.priority,
            service_type: formData.service_type,
            quick_service_tag: formData.quick_service_tag || undefined,
            repair_type: formData.repair_type,
            estimated_delivery: formData.estimated_delivery || undefined,
            labor_cost_usd: parseFloat(formData.labor_cost_usd) || 0,
            items_to_consume: itemsToConsume.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            })),
            missing_part_note: formData.missing_part_note || undefined,
            status: formData.status
        };
        mutation.mutate(payload);
    };

    const partsTotal = itemsToConsume.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const laborTotal = parseFloat(formData.labor_cost_usd) || 0;
    const grandTotal = partsTotal + laborTotal;
    const isRevision = formData.service_type === 'REVISION';
    const isOnHold = formData.status === 'on_hold';

    const handlePause = () => {
        setFormData({ ...formData, status: 'on_hold' });
        toast.warning('Orden pausada. Por favor especifique el repuesto faltante.');
    };

    const handleClose = () => {
        setIsSuccess(false);
        setCreatedOrder(null);
        setFormData(initialState);
        setSelectedCustomer(null);
        setItemsToConsume([]);
        onClose();
    };

    const handlePrintTicket = () => {
        if (createdOrder) {
            ticketService.generateReceptionTicket({
                orderId: createdOrder.id,
                customerName: selectedCustomer?.name || 'Cliente',
                device: createdOrder.device_model,
                problem: createdOrder.problem_description,
                estimatedCost: Number(createdOrder.labor_cost_usd || 0) + Number(createdOrder.parts_cost_usd || 0),
                exchangeRate: bcvRate,
                date: new Date().toISOString()
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={handleClose}></div>

                <div className="relative glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden border-white/10 animate-fade-in-up flex flex-col">
                    {isSuccess && createdOrder ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
                            <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-bounce-subtle">
                                <ClipboardCheck size={48} />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-white">¡ORDEN REGISTRADA!</h2>
                                <p className="text-slate-400">Identifica el equipo con el siguiente código:</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl px-12 py-8 flex flex-col items-center gap-2 group hover:border-primary-500/50 transition-colors">
                                <span className="text-xs font-black text-primary-400 uppercase tracking-[0.3em]">Orden de Servicio</span>
                                <span className="text-7xl font-black text-white tracking-tighter">#{createdOrder.id.toString().padStart(5, '0')}</span>
                            </div>

                            <div className="max-w-xs text-sm text-slate-500 font-medium">
                                Coloca este código en una etiqueta o cinta adhesiva sobre el dispositivo del cliente.
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                                <button
                                    onClick={handlePrintTicket}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 flex items-center justify-center gap-2"
                                >
                                    <FileText size={20} />
                                    Imprimir Ticket
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 btn-primary py-4 text-lg"
                                >
                                    Listo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                                        <Wrench size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{isEdit ? 'Editar Orden' : 'Nueva Orden de Servicio'}</h2>
                                        <p className="text-xs text-slate-400">Complete los detalles de la reparación</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo de Servicio</label>
                                        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                                            {SERVICE_TYPES.map(type => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => handleServiceTypeChange(type.id)}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${formData.service_type === type.id
                                                        ? `${type.color} shadow-lg shadow-black/20`
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    <type.icon size={16} />
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.service_type === 'HARDWARE' && (
                                        <div className="space-y-3 animate-fade-in-down">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Servicios Rápidos</label>
                                            <div className="flex flex-wrap gap-2">
                                                {QUICK_ACTIONS.map(action => (
                                                    <button
                                                        key={action.id}
                                                        type="button"
                                                        onClick={() => handleQuickAction(action)}
                                                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${formData.quick_service_tag === action.id
                                                            ? 'bg-primary-500/20 border-primary-500/40 text-primary-400'
                                                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                                            }`}
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cliente</label>
                                            {!selectedCustomer && (
                                                <button type="button" onClick={() => setShowCustomerModal(true)} className="text-[10px] font-bold text-primary-400 hover:underline">
                                                    + Nuevo
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder={selectedCustomer ? selectedCustomer.name : "Buscar cliente..."}
                                                className={`input-field h-12 w-full ${selectedCustomer ? 'text-primary-400 font-bold border-primary-500/30 bg-primary-500/5' : ''}`}
                                                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value);
                                                    setSelectedCustomer(null);
                                                    setFormData({ ...formData, customer_id: '' });
                                                    setShowCustomerDropdown(true);
                                                }}
                                                onFocus={() => setShowCustomerDropdown(true)}
                                            />
                                            {showCustomerDropdown && !selectedCustomer && customerSearch && (
                                                <div className="absolute z-60 w-full mt-2 glass-card border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                                    {filteredCustomers?.map(customer => (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            onClick={() => handleCustomerSelect(customer)}
                                                            className="w-full p-3 text-left hover:bg-white/5 border-b border-white/5 transition-colors"
                                                        >
                                                            <p className="text-sm font-bold text-white">{customer.name}</p>
                                                            <p className="text-[10px] text-slate-500">{customer.dni}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {selectedCustomer && (selectedCustomer.current_debt || 0) > 0.01 && (
                                            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-pulse">
                                                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                                                <div>
                                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Cliente con Deuda Pendiente</p>
                                                    <p className="text-xs font-bold text-slate-300">
                                                        Saldo deudor: <span className="text-rose-400">{formatVES((selectedCustomer.current_debt || 0) * bcvRate)}</span> ({formatUSD(selectedCustomer.current_debt || 0)})
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Marca</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Samsung"
                                                className="input-field h-10 w-full"
                                                value={formData.brand}
                                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            />
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {FEATURED_BRANDS.map(brand => (
                                                    <button
                                                        key={brand}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, brand })}
                                                        className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase transition-all ${formData.brand === brand
                                                            ? 'bg-primary-500/20 border-primary-500/40 text-primary-400'
                                                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                                            }`}
                                                    >
                                                        {brand}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Modelo</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: A52"
                                                className="input-field h-10 w-full"
                                                value={formData.model}
                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Falla Reportada</label>
                                            <textarea
                                                placeholder="Detalle el problema..."
                                                className="input-field p-3 h-20 resize-none w-full"
                                                value={formData.problem_description}
                                                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {(isOnHold || formData.status === 'on_hold') && (
                                        <div className="space-y-2 animate-fade-in-down">
                                            <div className="flex items-center gap-2 text-amber-400">
                                                <AlertCircle size={16} />
                                                <label className="text-[10px] font-black uppercase tracking-widest px-1">Repuesto Faltante</label>
                                            </div>
                                            <input
                                                type="text"
                                                required={isOnHold}
                                                placeholder="Ej: Pantalla Samsung A52 Original..."
                                                className="input-field h-12 w-full border-amber-500/30 text-amber-100 bg-amber-500/10 focus:border-amber-500"
                                                value={formData.missing_part_note}
                                                onChange={(e) => setFormData({ ...formData, missing_part_note: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {isEdit && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Estado de la Orden</label>
                                            <div className="relative">
                                                <select
                                                    className="input-field h-12 w-full appearance-none bg-slate-900 border-white/10"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                >
                                                    <option value="RECEIVED">RECIBIDO</option>
                                                    <option value="IN_PROGRESS">EN PROGRESO</option>
                                                    <option value="ON_HOLD">PAUSADO / ESPERA DE REPUESTO</option>
                                                    <option value="COMPLETED">LISTO / COMPLETADO</option>
                                                    {formData.status === 'DELIVERED' && <option value="DELIVERED">ENTREGADO (Solo Lectura)</option>}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full md:w-80 bg-black/20 border-l border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
                                    {!isRevision && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Repuestos ({itemsToConsume.length})</label>
                                            <InventoryPartPicker onSelectPart={addPart} initialSearch={partPickerSearch} />
                                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                {itemsToConsume.map(item => (
                                                    <div key={item.product_id} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5 text-xs">
                                                        <div className="truncate flex-1 pr-2">
                                                            <span className="font-bold text-white">{item.quantity}x</span> {item.name}
                                                        </div>
                                                        <button onClick={() => removePart(item.product_id)} className="text-slate-500 hover:text-rose-400">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto space-y-4 pt-6 border-t border-white/10">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Desglose de Costos</label>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-slate-400">Mano de Obra</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-500">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-20 bg-transparent text-right font-bold text-white focus:outline-none border-b border-white/10 focus:border-primary-500 p-1"
                                                        value={formData.labor_cost_usd}
                                                        onChange={(e) => setFormData({ ...formData, labor_cost_usd: e.target.value })}
                                                        disabled={isRevision}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-slate-400">Repuestos</span>
                                                <span className="font-bold text-slate-300 bg-white/5 px-2 py-1 rounded cursor-not-allowed">
                                                    ${partsTotal.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="pt-4 border-t border-white/10 flex flex-col gap-1 items-end">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equiv. BCV</span>
                                                    <span className="text-sm font-bold text-slate-400">{formatVES(grandTotal * bcvRate)}</span>
                                                </div>
                                                <span className="text-xs font-black text-slate-500 uppercase mt-2">Total Estimado</span>
                                                <span className="text-4xl font-black text-emerald-400 tracking-tight">${grandTotal.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={mutation.isPending || !!(selectedCustomer && (selectedCustomer.current_debt || 0) > 0.01)}
                                            className="w-full btn-primary h-14 text-lg font-bold group mt-4 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                        >
                                            {mutation.isPending ? <Loader2 className="animate-spin" /> : (
                                                <div className="flex items-center justify-center gap-2">
                                                    {(selectedCustomer && (selectedCustomer.current_debt || 0) > 0.01) ? (
                                                        <>
                                                            <AlertCircle size={20} />
                                                            <span>Cliente Bloqueado</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={20} className="group-hover:scale-110 transition-transform" />
                                                            <span>{isEdit ? 'Actualizar Orden' : 'Generar Orden'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </button>

                                        {isEdit && !isOnHold && (
                                            <button type="button" onClick={handlePause} className="w-full h-10 text-sm font-bold text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg transition-all">
                                                Pausar por Repuesto
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <CustomerQuickModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onCustomerCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ['customers'] });
                    setShowCustomerModal(false);
                    toast.success('Cliente creado. Búscalo en la lista.');
                }}
            />
        </>
    );
}

import { client } from './client';

export interface WorkOrderRead {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  problem_description: string;
  status: string;
  priority: string;
  repair_type: string;
  device_model: string;
  device_imei?: string;
  technician_id?: number;
  estimated_delivery?: string;
  service_type: string; // 'SOFTWARE' | 'HARDWARE' | 'REVISION'
  quick_service_tag?: string;
  labor_cost_usd: number;
  parts_cost_usd: number;
  paid_amount_usd: number;
  created_at: string;
}


export const repairService = {
  getWorkOrders: async () => {
    const { data } = await client.get<WorkOrderRead[]>('repairs/');
    return data;
  },

  getWorkOrder: async (id: number) => {
    const { data } = await client.get<WorkOrderRead>(`repairs/${id}`);
    return data;
  },

  createWorkOrder: async (orderData: any) => {
    const { data } = await client.post<WorkOrderRead>('repairs/', orderData);
    return data;
  },

  updateWorkOrder: async (id: number, orderData: any) => {
    const { data } = await client.put<WorkOrderRead>(`repairs/${id}`, orderData);
    return data;
  },

  deleteWorkOrder: async (id: number) => {
    await client.delete(`repairs/${id}`);
  },

  updateStatus: async (id: number, status: string) => {
    const { data } = await client.patch(`repairs/${id}/status`, { status });
    return data;
  },

  exportRepairs: async () => {
    const response = await client.get('repairs/export-csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reparaciones.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportRepairsPDF: async () => {
    const response = await client.get('repairs/export-pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reparaciones_${new Date().getTime()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getReceipt: async (id: number) => {
    const response = await client.get(`repairs/${id}/receipt`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recibo_reparacion_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  sendWhatsApp: async (id: number) => {
    const { data } = await client.post(`repairs/${id}/send-whatsapp`);
    return data;
  }
};

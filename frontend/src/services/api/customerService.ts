import { client } from "./client";
import { SaleRead } from "@/types/api";
import { WorkOrderRead } from "./repairService";

export type DniType = "V" | "J" | "E" | "P";

export interface CustomerRead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  dni?: string;
  dni_type?: DniType;
  notes?: string;
  loyalty_points?: number;
  credit_limit?: number;
  current_debt?: number;
  payment_terms?: number;
  credit_status?: string;
  credit_score?: number;
  last_payment_date?: string;
  is_active?: boolean;
  created_at: string;
  // Computed properties for display
  first_name?: string;
  last_name?: string;
}

export interface AccountTransaction {
  id: number;
  date: string;
  type: "CHARGE" | "PAYMENT";
  amount: number;
  reference?: string;
  description?: string;
}

export interface CustomerProfile extends CustomerRead {
  total_spent: number;
  last_purchase_date?: string;

  recent_sales: SaleRead[];
  active_repairs: WorkOrderRead[];
  repair_history: WorkOrderRead[];
  transactions: AccountTransaction[];
}

export interface CustomerCreate {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  dni?: string;
  dni_type?: DniType;
  notes?: string;
}

export const customerService = {
  getCustomers: async () => {
    const { data } = await client.get<CustomerRead[]>("customers/");
    return data;
  },

  getCustomer: async (id: number) => {
    const { data } = await client.get<CustomerRead>(`customers/${id}`);
    return data;
  },

  createCustomer: async (customerData: CustomerCreate) => {
    const { data } = await client.post<CustomerRead>(
      "customers/",
      customerData,
    );
    return data;
  },

  updateCustomer: async (id: number, customerData: Partial<CustomerCreate>) => {
    const { data } = await client.put<CustomerRead>(
      `customers/${id}`,
      customerData,
    );
    return data;
  },

  deleteCustomer: async (id: number) => {
    await client.delete(`customers/${id}`);
  },

  searchCustomers: async (query: string) => {
    const { data } = await client.get<CustomerRead[]>(
      `customers/search?q=${encodeURIComponent(query)}`,
    );
    return data;
  },

  getCustomerProfile: async (id: number) => {
    const { data } = await client.get<CustomerProfile>(
      `customers/${id}/profile`,
    );
    return data;
  },

  exportCustomers: async () => {
    const response = await client.get("customers/export-csv", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "clientes.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  importCustomers: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await client.post("customers/import-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  exportHistory: async (id: number, format: 'pdf' | 'excel' = 'pdf') => {
    const response = await client.get(`customers/${id}/export-history`, {
      params: { format },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    link.setAttribute("download", `historial_cliente_${id}.${extension}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

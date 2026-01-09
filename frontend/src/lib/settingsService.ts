import api from './api';

export interface SystemSettings {
  id: number;
  company_name: string;
  company_tax_id?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_logo_url?: string;
  receipt_header?: string;
  receipt_footer?: string;
  receipt_show_tax: boolean;
  default_currency: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
}

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings/');
    return response.data as SystemSettings;
  },
  
  updateSettings: async (data: Partial<SystemSettings>) => {
    const response = await api.put('/settings/', data);
    return response.data as SystemSettings;
  },

  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data as User[];
  },

  createUser: async (data: any) => {
    const response = await api.post('/users/', data);
    return response.data as User;
  },

  updateUser: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data as User;
  },

  getRoles: async () => {
    const response = await api.get('/users/roles');
    return response.data as Role[];
  },

  assignRole: async (userId: number, roleId: number) => {
    await api.post(`/users/${userId}/roles/${roleId}`);
  },

  removeRole: async (userId: number, roleId: number) => {
    await api.delete(`/users/${userId}/roles/${roleId}`);
  }
};

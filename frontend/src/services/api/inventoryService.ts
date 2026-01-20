import { client } from './client';
import { ProductRead } from '@/types/api';

export const inventoryService = {
  getProducts: async () => {
    const { data } = await client.get<ProductRead[]>('inventory/products');
    return data;
  },
  
  getProduct: async (id: number) => {
    const { data } = await client.get<ProductRead>(`inventory/products/${id}`);
    return data;
  },

  createProduct: async (productData: any) => {
    const { data } = await client.post<ProductRead>('inventory/products', productData);
    return data;
  },

  updateProduct: async (id: number, productData: any) => {
    const { data } = await client.put<ProductRead>(`inventory/products/${id}`, productData);
    return data;
  },

  deleteProduct: async (id: number) => {
    await client.delete(`inventory/products/${id}`);
  },

  getCategories: async () => {
    const { data } = await client.get<any[]>('inventory/categories');
    return data;
  },

  createCategory: async (categoryData: any) => {
    const { data } = await client.post('inventory/categories', categoryData);
    return data;
  },

  importProducts: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await client.post('inventory/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  exportProducts: async () => {
    const response = await client.get('inventory/export-csv', {
        responseType: 'blob'
    });
    return response.data;
  }
};

import { client } from './client';
import { PaginatedResponse } from '@/types/api';

export interface AuditLog {
    id: number;
    user_id?: number;
    username?: string;
    action: string;
    target_type: string;
    target_id?: number;
    details?: any;
    ip_address?: string;
    created_at: string;
}

export const auditService = {
    getLogs: async (params: { page?: number; size?: number; action?: string; target_type?: string; user_id?: number }) => {
        const { data } = await client.get<PaginatedResponse<AuditLog>>('audit/', { params });
        return data;
    }
};

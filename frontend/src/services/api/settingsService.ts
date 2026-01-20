import { client } from './client';

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
    receipt_show_tax?: boolean;
    default_currency?: string;
    whatsapp_api_url?: string;
    whatsapp_token?: string;
    telegram_token?: string;
    google_drive_folder_id?: string;
}

export const settingsService = {
    getSettings: async () => {
        const { data } = await client.get<SystemSettings>('settings/');
        return data;
    },
    updateSettings: async (settings: Partial<SystemSettings>) => {
        const { data } = await client.put<SystemSettings>('settings/', settings);
        return data;
    }
};

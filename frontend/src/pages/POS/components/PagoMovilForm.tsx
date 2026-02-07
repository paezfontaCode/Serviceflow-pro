import { useState, useEffect } from 'react';
import { Smartphone, Hash, Copy, Check, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface PagoMovilFormProps {
    amount: number;
    currency: 'USD' | 'VES';
    rate: number;
    onChange: (data: { reference: string, phone?: string }) => void;
}

const BANK_DETAILS = {
    bank: 'Banco de Venezuela',
    phone: '0414-1234567',
    id: 'V-12345678',
    name: 'ServiceFlow Pro'
};

export default function PagoMovilForm({ amount, currency, rate, onChange }: PagoMovilFormProps) {
    const [reference, setReference] = useState('');
    const [phone, setPhone] = useState('');
    const [copied, setCopied] = useState(false);

    // Calculate amount in VES if currency is USD
    const amountVES = currency === 'USD' ? amount * rate : amount;

    useEffect(() => {
        onChange({ reference, phone });
    }, [reference, phone, onChange]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copiado al portapapeles');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Bank Details Card */}
            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Datos Pago Móvil</p>
                            <p className="text-sm font-bold text-white">{BANK_DETAILS.bank}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => copyToClipboard(`${BANK_DETAILS.phone} - ${BANK_DETAILS.id}`)}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Copiar datos"
                    >
                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-black/20 p-2 rounded-lg">
                        <span className="block text-[10px] text-slate-500">Teléfono</span>
                        <span className="font-mono text-slate-300">{BANK_DETAILS.phone}</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg">
                        <span className="block text-[10px] text-slate-500">C.I. / RIF</span>
                        <span className="font-mono text-slate-300">{BANK_DETAILS.id}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Monto a Pagar:</span>
                    <span className="text-lg font-black text-purple-400">Bs. {amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-3">
                <Input
                    label="Número de Referencia (4 últimos dígitos)"
                    placeholder="Ej: 1234"
                    value={reference}
                    onChange={(e) => {
                        // Allow only numbers
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setReference(val);
                    }}
                    leftIcon={<Hash size={16} />}
                    maxLength={6}
                    className="font-mono tracking-widest text-lg"
                />

                <Input
                    label="Teléfono del Pagador (Opcional)"
                    placeholder="04xx-xxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    leftIcon={<Smartphone size={16} />}
                />
            </div>

            {/* Simulated QR Code (Placeholder) */}
            <div className="flex justify-center py-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/5 px-3 py-1 rounded-full">
                    <QrCode size={14} />
                    <span>Escanea para pagar (Próximamente)</span>
                </div>
            </div>
        </div>
    );
}

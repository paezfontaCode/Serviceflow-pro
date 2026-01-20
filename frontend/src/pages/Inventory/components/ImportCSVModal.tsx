import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Download, Check, AlertCircle } from 'lucide-react';
import { inventoryService } from '@/services/api/inventoryService';
import { toast } from 'sonner';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportCSVModal({ isOpen, onClose, onSuccess }: ImportCSVModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ created: number; updated: number; errors: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.csv')) {
            setFile(files[0]);
            setResult(null);
        } else {
            toast.error('Por favor sube un archivo CSV válido');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await inventoryService.exportProducts();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plantilla_productos.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast.error('Error al descargar la plantilla');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        try {
            const stats = await inventoryService.importProducts(file);
            setResult(stats);
            if (stats.errors === 0) {
                toast.success('Importación completada con éxito');
            } else {
                toast.warning(`Importación completada con ${stats.errors} errores`);
            }
            onSuccess(); // Refresh table behind modal
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar el archivo');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                            <FileSpreadsheet size={20} />
                        </div>
                        Importar Productos
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    
                    {!result ? (
                        <>
                            {/* Upload Area */}
                            <div 
                                className={`
                                    border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                    ${isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                                    ${file ? 'bg-emerald-500/5 border-emerald-500/30' : ''}
                                `}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                />
                                
                                {file ? (
                                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{file.name}</p>
                                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); resetForm(); }}
                                            className="text-xs text-rose-400 hover:text-rose-300 hover:underline mt-2"
                                        >
                                            Cambiar archivo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Upload size={32} className="opacity-50" />
                                        <div>
                                            <p className="font-bold text-slate-300">Haz clic o arrastra tu CSV aquí</p>
                                            <p className="text-xs mt-1 opacity-60">Soporta archivos .csv hasta 5MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Template Link */}
                            <div className="text-center">
                                <button 
                                    onClick={handleDownloadTemplate}
                                    className="text-xs text-primary-400 hover:text-primary-300 hover:underline flex items-center justify-center gap-1 mx-auto"
                                >
                                    <Download size={12} />
                                    Descargar plantilla de ejemplo
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Results View */
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                                    <p className="text-xs font-bold text-emerald-500 uppercase">Creados</p>
                                    <p className="text-2xl font-black text-white">{result.created}</p>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                                    <p className="text-xs font-bold text-amber-500 uppercase">Actualizados</p>
                                    <p className="text-2xl font-black text-white">{result.updated}</p>
                                </div>
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center">
                                    <p className="text-xs font-bold text-rose-500 uppercase">Errores</p>
                                    <p className="text-2xl font-black text-white">{result.errors}</p>
                                </div>
                            </div>
                            
                            {result.errors > 0 && (
                                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                    <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-rose-200">
                                        Algunas filas no pudieron ser importadas. Revisa que el archivo tenga el formato correcto y todos los campos requeridos (nombre, sku).
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center pt-2">
                                <button 
                                    onClick={resetForm}
                                    className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Importar otro archivo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors font-bold"
                        >
                            {result ? 'Cerrar' : 'Cancelar'}
                        </button>
                        
                        {!result && (
                            <button
                                onClick={handleUpload}
                                disabled={!file || isLoading}
                                className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Procesar Importación
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

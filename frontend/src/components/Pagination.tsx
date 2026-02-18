import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsOnPage: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsOnPage,
    onPageChange
}: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-xs text-slate-500 font-bold">
                Mostrando <span className="text-white">{itemsOnPage}</span> de <span className="text-white">{totalItems}</span> registros
            </p>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl glass border border-white/5 text-slate-400 disabled:opacity-20 disabled:hover:bg-transparent hover:bg-white/5 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center gap-1 px-4 py-2 glass rounded-xl border border-white/5">
                    <span className="text-sm font-black text-primary-400">{currentPage}</span>
                    <span className="text-xs font-bold text-slate-600 px-1">/</span>
                    <span className="text-sm font-bold text-slate-500">{totalPages}</span>
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl glass border border-white/5 text-slate-400 disabled:opacity-20 disabled:hover:bg-transparent hover:bg-white/5 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { FileText, FileSpreadsheet, Loader2, ShoppingCart } from "lucide-react";
import { reportService } from "../../services/api/reportService";
import { toast } from "sonner";

interface ReplenishmentItem {
  priority: "URGENT" | "HIGH" | "LOW";
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  notes: string;
}

const Logistics = () => {
  const [items, setItems] = useState<ReplenishmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);

  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReplenishmentPreview();
      setItems(data);
    } catch (error) {
      toast.error("Error cargando datos de logística");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: "pdf" | "excel") => {
    try {
      setDownloading(format);
      const blob = await reportService.downloadReport(format);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `reporte_reposicion.${format === "excel" ? "xlsx" : "pdf"}`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success(`Reporte ${format.toUpperCase()} descargado`);
    } catch (error) {
      toast.error("Error al generar el reporte");
      console.error(error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Logística y Reposición
          </h1>
          <p className="text-gray-400 mt-1">
            Gestión de compras y stock crítico
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleDownload("pdf")}
            disabled={!!downloading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all disabled:opacity-50 backdrop-blur-sm"
          >
            {downloading === "pdf" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            Reporte PDF
          </button>

          <button
            onClick={() => handleDownload("excel")}
            disabled={!!downloading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all disabled:opacity-50 backdrop-blur-sm"
          >
            {downloading === "excel" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5" />
            )}
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Main Content - Glassmorphism Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">
            Previsualización de Compras
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-dashed border-white/10">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay items pendientes de reposición.</p>
            <p className="text-sm mt-1">Inventario saludable.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 text-sm">
                  <th className="pb-4 pl-4">Prioridad</th>
                  <th className="pb-4">Producto / Motivo</th>
                  <th className="pb-4">SKU</th>
                  <th className="pb-4 text-center">Stock Actual</th>
                  <th className="pb-4 text-center">Mínimo</th>
                  <th className="pb-4">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 pl-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          item.priority === "URGENT"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }`}
                      >
                        {item.priority === "URGENT"
                          ? "URGENTE 🔥"
                          : "STOCK BAJO"}
                      </span>
                    </td>
                    <td className="py-4 text-white font-medium">{item.name}</td>
                    <td className="py-4 text-gray-400 font-mono text-sm">
                      {item.sku}
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-red-400 font-bold">
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="py-4 text-center text-gray-400">
                      {item.min_stock}
                    </td>
                    <td className="py-4 text-gray-400 text-sm max-w-xs truncate">
                      {item.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logistics;

"use client";

import { useState, useEffect } from "react";
import { financeService } from "@/lib/financeService";
import { useFinanceStore } from "@/store/useFinanceStore";
import {
  TrendingUp,
  Wallet,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FinanceDashboard() {
  const [rate, setRate] = useState<string>("");
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const {
    currentSession,
    fetchCurrentSession,
    closeSession,
    isLoading: isSessionLoading,
  } = useFinanceStore();
  const [actualAmount, setActualAmount] = useState<string>("");
  const [actualAmountVES, setActualAmountVES] = useState<string>("");

  useEffect(() => {
    fetchCurrentSession();
    financeService
      .getCurrentRate()
      .then((data) => {
        // Use Number() to remove trailing zeros from decimal string
        setRate(Number(data.rate).toString());
      })
      .catch(() => {});
  }, [fetchCurrentSession]);

  const handleUpdateRate = async () => {
    setIsUpdatingRate(true);
    try {
      await financeService.updateExchangeRate(parseFloat(rate));
      alert("Tasa actualizada correctamente");
    } catch (err) {
      alert("Error al actualizar tasa");
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const handleCloseSession = async () => {
    if (!confirm("¿Estás seguro de que deseas cerrar la caja?")) return;
    try {
      await closeSession(parseFloat(actualAmount), parseFloat(actualAmountVES));
      alert("Caja cerrada correctamente");
      setActualAmount("");
      setActualAmountVES("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Finanzas
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gestiona la tasa de cambio y las sesiones de caja.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasa de Cambio */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Tasa de Cambio</CardTitle>
              <CardDescription>USD a VES (Tasa del día)</CardDescription>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="pl-4 h-12 text-lg font-mono font-bold"
                  placeholder="Ej: 36.50"
                  step="0.01"
                />
              </div>
              <Button
                onClick={handleUpdateRate}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-6"
                disabled={isUpdatingRate}
              >
                {isUpdatingRate ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado de Caja */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Estado de Caja</CardTitle>
              <CardDescription>
                {currentSession
                  ? `Sesión Activa: ${currentSession.session_code}`
                  : "No hay sesión activa"}
              </CardDescription>
            </div>
            <Wallet
              className={currentSession ? "text-green-600" : "text-gray-400"}
            />
          </CardHeader>
          <CardContent className="pt-4">
            {currentSession ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-500 text-xs uppercase font-bold mb-1">Esperado USD</span>
                    <span className="font-bold text-lg text-blue-600">
                      $
                      {Number(currentSession.expected_amount).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-500 text-xs uppercase font-bold mb-1">Esperado VES</span>
                    <span className="font-bold text-lg text-green-600">
                      Bs. 
                      {Number(currentSession.expected_amount_ves).toLocaleString(
                        "es-VE",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Real en Caja USD</Label>
                    <Input
                      type="number"
                      placeholder="Efectivo $"
                      value={actualAmount}
                      onChange={(e) => setActualAmount(e.target.value)}
                      className="h-10 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Real en Caja VES</Label>
                    <Input
                      type="number"
                      placeholder="Efectivo Bs"
                      value={actualAmountVES}
                      onChange={(e) => setActualAmountVES(e.target.value)}
                      className="h-10 font-bold"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCloseSession}
                  variant="destructive"
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold"
                  disabled={isSessionLoading || (!actualAmount && !actualAmountVES)}
                >
                  Cerrar Caja
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  Debes abrir caja para poder realizar ventas.
                </p>
                <Button
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() =>
                    (window.location.href = "/dashboard/finance/cash-open")
                  }
                >
                  Ir a Apertura de Caja <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cuentas por Cobrar */}
        <Card className="border-none shadow-lg col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Gestión de Crédito</CardTitle>
              <CardDescription>
                Control de cuentas por cobrar y abonos
              </CardDescription>
            </div>
            <CreditCard className="h-6 w-6 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Administra las deudas de clientes, registra pagos parciales y
                visualiza el estado de la cartera de crédito.
              </p>
              <Button
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() =>
                  (window.location.href = "/dashboard/finance/receivable")
                }
              >
                Ir a Cuentas por Cobrar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

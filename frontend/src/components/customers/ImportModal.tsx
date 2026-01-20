'use client'

import { useState } from 'react'
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { customerService } from '@/services/api/customerService'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CustomerImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ created: number, updated: number, errors: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    try {
      const stats = await customerService.importCustomers(file)
      setResult(stats)
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al importar el archivo. Verifica el formato del CSV.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Importar Clientes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            <>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="customer-csv-upload"
                />
                <label
                  htmlFor="customer-csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-3 group"
                >
                  <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {file ? file.name : 'Selecciona tu archivo CSV de clientes'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Columnas recomendadas: name, dni, email, phone, address
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Si la cédula/RIF (dni) ya existe, el cliente se actualizará. Si no existe, se creará uno nuevo.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Iniciar Importación'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="h-16 w-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">¡Importación Completada!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resumen del proceso:</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.created}</p>
                  <p className="text-xs text-gray-500">Nuevos</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.updated}</p>
                  <p className="text-xs text-gray-500">Actualizados</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                  <p className="text-xs text-gray-500">Errores</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

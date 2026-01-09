'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Option {
  value: string | number
  label: string
  subLabel?: string
}

interface SearchableSelectProps {
  options: Option[]
  value?: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className,
  isLoading = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (option.subLabel && option.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 flex items-center justify-between border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
          isOpen ? "border-orange-500 ring-1 ring-orange-500" : "border-gray-300 dark:border-gray-700",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn("block truncate", !selectedOption && "text-gray-500 dark:text-gray-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-md focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-48 py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center justify-between",
                      value === option.value && "bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400"
                    )}
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      {option.subLabel && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.subLabel}
                        </div>
                      )}
                    </div>
                    {value === option.value && (
                      <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

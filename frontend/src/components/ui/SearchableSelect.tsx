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
          "w-full px-3 py-2.5 flex items-center justify-between border rounded-xl bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-all",
          isOpen ? "border-purple-500 ring-1 ring-purple-500/50" : "border-white/10",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn("block truncate", !selectedOption && "text-gray-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-gray-500" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-full mt-1 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col backdrop-blur-xl ring-1 ring-black/5"
          >
            <div className="p-2 border-b border-white/5 sticky top-0 bg-[#0a0a0f]/95 backdrop-blur">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/5 rounded-lg focus:ring-1 focus:ring-purple-500/50 text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-48 py-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
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
                      "px-3 py-2.5 text-sm cursor-pointer hover:bg-white/5 flex items-center justify-between transition-colors",
                      value === option.value && "bg-purple-500/10 text-purple-400"
                    )}
                  >
                    <div>
                      <div className={cn("font-medium", value === option.value ? "text-purple-400" : "text-gray-200")}>
                        {option.label}
                      </div>
                      {option.subLabel && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {option.subLabel}
                        </div>
                      )}
                    </div>
                    {value === option.value && (
                      <Check className="h-4 w-4 text-purple-400" />
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

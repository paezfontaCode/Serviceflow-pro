'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Wrench,
  Package,
  ClipboardList,
  ArrowRight,
  HardHat
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TechnicianDashboard() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  const actions = [
    {
      title: 'Gestión de Reparaciones',
      description: 'Ver y actualizar estados de equipos',
      icon: Wrench,
      href: '/dashboard/repairs',
      color: 'bg-amber-500',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Inventario de Repuestos',
      description: 'Consultar disponibilidad de partes',
      icon: Package,
      href: '/dashboard/inventory',
      color: 'bg-cyan-500',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Mis Trabajos Pendientes',
      description: 'Ver reparaciones asignadas a mí',
      icon: ClipboardList,
      href: '/dashboard/repairs?filter=my_pending', // Assuming this filter works or just linking to repairs
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-8 py-8"
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
           <HardHat className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Panel Técnico</h1>
          <p className="text-gray-400">Área de servicio y reparaciones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Link href={action.href} key={action.title}>
            <motion.div
              variants={item}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative h-full overflow-hidden rounded-3xl bg-[#0a0a0f]/40 border border-white/5 p-8 backdrop-blur-md transition-all hover:border-white/10 hover:shadow-2xl"
            >
              <div className={cn(
                "absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-20 bg-gradient-to-br",
                action.gradient
              )} />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className={cn(
                    "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-lg",
                    action.color
                  )}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                  <p className="text-gray-400 text-sm font-medium">{action.description}</p>
                </div>
                <div className="mt-6 flex justify-end">
                   <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                      <ArrowRight className="h-4 w-4" />
                   </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

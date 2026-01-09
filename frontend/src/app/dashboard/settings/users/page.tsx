'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, User, Role } from '@/lib/settingsService'
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Loader2, 
  Mail,
  MoreVertical,
  X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function UserManagementPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => settingsService.getUsers()
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => settingsService.getRoles()
  })

  const mutation = useMutation({
    mutationFn: (data: any) => editingUser 
      ? settingsService.updateUser(editingUser.id, data)
      : settingsService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsFormOpen(false)
      setEditingUser(null)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error al procesar usuario")
    }
  })

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number, roleId: number }) => 
      settingsService.assignRole(userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number, roleId: number }) => 
      settingsService.removeRole(userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      username: formData.get('username'),
      email: formData.get('email'),
      full_name: formData.get('full_name'),
      password: formData.get('password') || undefined,
      is_active: formData.get('is_active') === 'on'
    }
    mutation.mutate(data)
  }

  const toggleRole = (user: User, role: Role) => {
    const hasRole = user.roles.some(r => r.id === role.id)
    if (hasRole) {
      removeRoleMutation.mutate({ userId: user.id, roleId: role.id })
    } else {
      assignRoleMutation.mutate({ userId: user.id, roleId: role.id })
    }
  }

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Controla quién tiene acceso al sistema y sus permisos.</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            setIsFormOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <UserPlus className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4 font-bold">Usuario</th>
              <th className="px-6 py-4 font-bold">Roles / Permisos</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white uppercase shadow-sm">
                      {user.username.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{user.username}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {roles?.map(role => {
                      const isActive = user.roles.some(r => r.id === role.id)
                      return (
                        <button
                          key={role.id}
                          onClick={() => toggleRole(user, role)}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                            isActive 
                              ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50" 
                              : "bg-gray-100 text-gray-400 border-transparent dark:bg-gray-800 dark:text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {role.name}
                        </button>
                      )
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setEditingUser(user)
                      setIsFormOpen(true)
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl p-8 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                 <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1">Nombre de Usuario</label>
                  <input name="username" defaultValue={editingUser?.username} required className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1">Email</label>
                  <input name="email" type="email" defaultValue={editingUser?.email} required className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1">Nombre Completo</label>
                  <input name="full_name" defaultValue={editingUser?.full_name} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1">
                    Contraseña {editingUser && <span className="text-[10px] text-gray-400 normal-case">(Dejar en blanco para mantener actual)</span>}
                  </label>
                  <input name="password" type="password" required={!editingUser} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 ring-blue-500/20 outline-none" />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <input type="checkbox" name="is_active" id="is_active" defaultChecked={editingUser ? editingUser.is_active : true} className="h-4 w-4 text-blue-600 rounded" />
                <label htmlFor="is_active" className="text-xs font-bold text-gray-700 dark:text-gray-300">Usuario Activo</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2.5 border rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

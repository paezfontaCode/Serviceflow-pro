'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Loader2, Zap, Wrench, User, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      
      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const { access_token } = response.data
      
      // Get user profile (optional, or just use info from token if possible)
      // For now we'll just set dummy user info until we have a /me endpoint
      setAuth({ id: 1, username, email: '', roles: [{ name: 'admin' }] }, access_token)
      
      router.push('/dashboard')
    } catch (err: any) {
      setError('Credenciales incorrectas o error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-white font-sans selection:bg-purple-500 selection:text-white overflow-hidden">
      {/* Left Section - Marketing */}
      <div className="hidden lg:flex w-1/2 relative bg-[#05050a] flex-col justify-center px-12 xl:px-24 overflow-hidden border-r border-white/5">
        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.08),transparent_40%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.08),transparent_40%)]"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-8 w-fit backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            Sistema Operativo v2.0
          </div>

          <h1 className="text-5xl xl:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Gestión Técnica <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              Inteligente
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-12 max-w-lg leading-relaxed">
            Optimiza tu taller con ServiceFlow. Control total sobre reparaciones, inventario y ventas en una interfaz diseñada para profesionales.
          </p>

          <div className="flex flex-wrap gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[170px] backdrop-blur-sm transition-transform hover:scale-105 duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Uptime</div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[170px] backdrop-blur-sm transition-transform hover:scale-105 duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 ring-1 ring-inset ring-purple-500/20">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">+500</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Reparaciones</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative bg-[#0a0a0f]">
        <div className="w-full max-w-md space-y-8 bg-white/[0.02] p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm relative z-10">
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25 transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Bienvenido de nuevo</h2>
            <p className="text-gray-400">ingresa tus credenciales para acceder al panel</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors duration-300" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl leading-5 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-300 hover:bg-white/[0.05]"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors duration-300" />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl leading-5 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 sm:text-sm transition-all duration-300 hover:bg-white/[0.05]"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-white/10 border-gray-700 rounded text-purple-600 focus:ring-offset-gray-900 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-gray-400 cursor-pointer select-none">
                  Recordarme
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center gap-2">
                  Iniciar Sesión 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">¿No tienes cuenta?</span>{' '}
            <a href="#" className="font-medium text-gray-300 hover:text-white transition-colors">
              Contacta al Admin
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-6 left-0 w-full text-center">
            <p className="text-[10px] text-gray-700 uppercase tracking-widest">ServiceFlow System v1.2.0 • Build 2024</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Logo from '@/components/brand/Logo'
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Email ou senha incorretos. Verifique suas credenciais.'
        : error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-rose-50/70 via-white to-emerald-50/50 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-xl shadow-pink-900/5 border border-pink-100/80 transition-all">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-pink-100 mb-4 transition-transform hover:scale-105">
              <Logo variant="full" size="lg" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-[#e60067] rounded-full text-xs font-bold uppercase tracking-wider border border-pink-200/60">
                <Sparkles className="w-3.5 h-3.5" />
                Sistema de Gestão
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Acesso ao Sistema
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Entre com suas credenciais para gerenciar pedidos e produção
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/70 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#e60067] focus:border-transparent transition-all outline-none"
                  placeholder="admin@fitdali.com.br"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-11 py-3 bg-gray-50/70 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#e60067] focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-[#e60067] via-[#f02279] to-[#ff3b8d] text-white text-sm font-bold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ambiente Seguro • Fit DaLi ERP</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          © 2026 Fit DaLi — saudável com sabor!
        </p>
      </div>
    </div>
  )
}

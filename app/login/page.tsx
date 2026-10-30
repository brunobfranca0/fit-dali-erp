'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Logo from '@/components/brand/Logo'
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import GlowButton from '@/components/kokonutui/glow-button'

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
      setError(
        error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
          : error.message
      )
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-rose-50/70 via-white to-emerald-50/50 relative overflow-hidden select-none">
      {/* Kokonut Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#e60067]/25 via-pink-400/15 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-[#38a149]/20 via-emerald-300/10 to-transparent blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card with Kokonut UI Glassmorphism */}
        <div className="relative rounded-[32px] bg-white/85 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_20px_50px_-15px_rgba(230,0,103,0.12)] border border-white/80 ring-1 ring-black/5">
          {/* Top Logo Badge */}
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex items-center justify-center p-4 bg-white/90 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-pink-100/80 mb-4 cursor-pointer"
            >
              <Logo variant="full" size="lg" />
            </motion.div>

            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-[#e60067] rounded-full text-[11px] font-bold uppercase tracking-wider border border-rose-200/60 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                Sistema de Gestão ERP
              </span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Acesso ao Sistema
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium flex items-center justify-center gap-1">
              <span>Comida de verdade para uma vida mais leve!</span>
              <Heart className="w-3 h-3 text-[#e60067] fill-[#e60067]" />
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 flex-shrink-0 animate-ping" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#e60067] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/80 hover:bg-gray-50 focus:bg-white rounded-2xl border border-gray-200/90 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067] transition-all outline-none shadow-xs"
                  placeholder="admin@fitdali.com.br"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#e60067] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-11 py-3.5 bg-gray-50/80 hover:bg-gray-50 focus:bg-white rounded-2xl border border-gray-200/90 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067] transition-all outline-none shadow-xs"
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

            <GlowButton
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full mt-2"
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
            </GlowButton>
          </form>

          {/* Footer inside card */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Fit DaLi ERP • Conexão Segura</span>
          </div>
        </div>

        {/* Outer Brand Copyright */}
        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          Fit DaLi — saudável com sabor!
        </p>
      </motion.div>
    </div>
  )
}

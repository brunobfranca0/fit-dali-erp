'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChefHat,
  Sparkles
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Logo from '@/components/brand/Logo'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users },
  { name: 'Produtos & Cardápio', href: '/dashboard/products', icon: Package },
  { name: 'Produção', href: '/dashboard/production', icon: ChefHat },
  { name: 'Relatórios', href: '/dashboard/reports', icon: TrendingUp },
  { name: 'Identidade & Ajustes', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-gray-900 antialiased">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200/80 shadow-sm flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
            <Logo variant="horizontal" size="md" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Menu Principal
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
                  isActive
                    ? 'bg-rose-50 text-[#e60067] shadow-sm shadow-pink-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#e60067] rounded-r-full" />
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#e60067]' : 'text-gray-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-3 mb-3 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#e60067] to-[#ec4899] flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">
                {user?.email || 'Administrador'}
              </p>
              <p className="text-[10px] font-semibold text-[#e60067] uppercase tracking-wide">
                Gestor Fit DaLi
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="flex items-center">
              <Logo variant="horizontal" size="sm" showTagline={false} />
            </Link>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

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
  KeyRound,
  ContactRound,
  Wallet,
  Search,
  Plus,
  UserPlus
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Logo from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { capitalizeFirst } from '@/lib/utils'
import { ROLE_LABELS, type AppRole, isAppRole } from '@/lib/auth/roles'
import { FeedbackProvider } from '@/components/ui/feedback'
import CommandPalette, { type CommandItem } from '@/components/dashboard/command-palette'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'gestor', 'atendimento'] },
  { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingBag, roles: ['admin', 'gestor', 'atendimento'] },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users, roles: ['admin', 'gestor', 'atendimento'] },
  { name: 'CRM My Kora', href: '/dashboard/crm', icon: ContactRound, roles: ['admin', 'gestor', 'atendimento'] },
  { name: 'Produtos & Cardápio', href: '/dashboard/products', icon: Package, roles: ['admin', 'gestor'] },
  { name: 'Produção', href: '/dashboard/production', icon: ChefHat, roles: ['admin', 'gestor', 'producao'] },
  { name: 'Financeiro', href: '/dashboard/expenses', icon: Wallet, roles: ['admin', 'gestor'] },
  { name: 'Relatórios', href: '/dashboard/reports', icon: TrendingUp, roles: ['admin', 'gestor'] },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'gestor'] },
  { name: 'Acessos', href: '/dashboard/users', icon: KeyRound, roles: ['admin'] },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const userRole: AppRole | null = isAppRole(user?.app_metadata?.role) ? user.app_metadata.role : null

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

  useEffect(() => {
    if (!sidebarOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  useEffect(() => {
    const openOnShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(open => !open)
      }
    }
    window.addEventListener('keydown', openOnShortcut)
    return () => window.removeEventListener('keydown', openOnShortcut)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const currentNav = navigation.find(n => 
    n.href === pathname || (n.href !== '/dashboard' && pathname?.startsWith(n.href))
  )
  const allowedNavigation = navigation.filter(item => userRole && item.roles.includes(userRole))
  const canSell = userRole === 'admin' || userRole === 'gestor' || userRole === 'atendimento'
  const commandItems: CommandItem[] = [
    ...(canSell ? [
      { id: 'new-order', label: 'Novo pedido', hint: 'Ação', href: '/dashboard/orders?new=1', icon: Plus, keywords: 'criar venda' },
      { id: 'new-customer', label: 'Novo cliente', hint: 'Ação', href: '/dashboard/customers?new=1', icon: UserPlus, keywords: 'criar cadastrar' },
    ] : []),
    ...allowedNavigation.map(item => ({ id: item.href, label: item.name, hint: 'Módulo', href: item.href, icon: item.icon })),
  ]
  const todayLabel = capitalizeFirst(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()))

  return (
    <FeedbackProvider>
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar navegação"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-navigation"
        aria-label="Navegação principal"
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
            <Logo variant="horizontal" size="sm" />
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav aria-label="Navegação principal" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Módulos
          </div>
          {allowedNavigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#2e7d32] dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#2e7d32] rounded-r-full" />
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#2e7d32] dark:text-emerald-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer section in sidebar: Theme + User */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Aparência</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#2e7d32] flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.email || 'admin@fitdali.com.br'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {userRole ? ROLE_LABELS[userRole] : 'Perfil não carregado'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Encerrar Sessão"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content layout */}
      <div className="lg:pl-64 print:pl-0 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="print:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menu"
                aria-expanded={sidebarOpen}
                aria-controls="app-navigation"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{currentNav?.name || 'Painel'}</span>
                <span suppressHydrationWarning className="hidden truncate text-[11px] text-slate-400 sm:block">{todayLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Abrir busca rápida"
                aria-keyshortcuts="Control+K"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-700 dark:hover:text-slate-300 sm:w-64"
              >
                <Search className="h-4 w-4" />
                <span className="hidden flex-1 text-left sm:inline">Buscar ou ir para...</span>
                <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900 sm:inline">Ctrl K</kbd>
              </button>
              <ThemeToggle className="sm:hidden" />
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={commandItems} />
    </div>
    </FeedbackProvider>
  )
}

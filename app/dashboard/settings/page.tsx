'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, 
  CreditCard, 
  Truck, 
  Shield, 
  Key, 
  Download, 
  Check, 
  Database, 
  Moon, 
  Sun, 
  Laptop, 
  AlertCircle,
  Save
} from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'
import { useTheme } from '@/components/theme/theme-provider'
import { getLocalDateISO } from '@/lib/utils'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Settings State (saved in localStorage / state for instant operational use)
  const [companyData, setCompanyData] = useState({
    businessName: 'Fit DaLi - Marmitas Fitness',
    document: '51.984.120/0001-90',
    kitchenAddress: 'Av. Principal, 1200 - Centro Operacional',
    pixKey: 'pix@fitdali.com.br',
    pixType: 'Chave E-mail',
    deliveryFee: '8.00',
    orderCutoffHour: '20:00',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const saved = localStorage.getItem('fitdali-company-settings')
    if (saved) {
      try {
        setCompanyData(JSON.parse(saved))
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    localStorage.setItem('fitdali-company-settings', JSON.stringify(companyData))
    setTimeout(() => {
      setLoading(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 300)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setPasswordLoading(false)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess(false)
      }, 1800)
    }
  }

  const handleExportOrders = async () => {
    const supabase = createClient()
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!orders || orders.length === 0) {
      alert('Nenhum pedido encontrado para exportar.')
      return
    }

    const headers = ['ID', 'Cliente', 'Data Pedido', 'Data Entrega', 'Status', 'Pagamento', 'Total']
    const rows = orders.map(o => [
      o.id,
      `"${o.customer_name}"`,
      o.order_date,
      o.delivery_date,
      o.status,
      o.payment_status,
      o.total,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `pedidos-fit-dali-${getLocalDateISO()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportCustomers = async () => {
    const supabase = createClient()
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .order('name')

    if (!customers || customers.length === 0) {
      alert('Nenhum cliente cadastrado para exportar.')
      return
    }

    const headers = ['ID', 'Nome', 'Telefone', 'Email', 'Endereco', 'Notas']
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      c.phone || '',
      c.email || '',
      `"${c.address || ''}"`,
      `"${c.notes || ''}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `clientes-fit-dali-${getLocalDateISO()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerencie dados da empresa, chaves de recebimento, preferências de entrega e segurança
        </p>
      </div>

      {/* Form de Dados da Empresa */}
      <form onSubmit={handleSaveCompanySettings} className="space-y-6">
        {/* Card 1: Informações da Marmitaria */}
        <BentoCard className="p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2e7d32] dark:text-emerald-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Dados da Marmitaria & Cozinha
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informações cadastrais e endereço da operação
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={companyData.businessName}
                onChange={e => setCompanyData({ ...companyData, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                CNPJ / MEI
              </label>
              <input
                type="text"
                value={companyData.document}
                onChange={e => setCompanyData({ ...companyData, document: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Endereço da Cozinha Central
              </label>
              <input
                type="text"
                value={companyData.kitchenAddress}
                onChange={e => setCompanyData({ ...companyData, kitchenAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              />
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Recebimentos & Entregas */}
        <BentoCard className="p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pagamentos & Logística
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configuração da chave PIX e parâmetros de envio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chave PIX Padrão
              </label>
              <input
                type="text"
                value={companyData.pixKey}
                onChange={e => setCompanyData({ ...companyData, pixKey: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo da Chave
              </label>
              <select
                value={companyData.pixType}
                onChange={e => setCompanyData({ ...companyData, pixType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              >
                <option value="Chave E-mail">E-mail</option>
                <option value="Chave CNPJ">CNPJ</option>
                <option value="Chave Telefone">Telefone</option>
                <option value="Chave Aleatória">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Taxa de Entrega Padrão (R$)
              </label>
              <input
                type="number"
                step="0.50"
                value={companyData.deliveryFee}
                onChange={e => setCompanyData({ ...companyData, deliveryFee: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Horário Limite para Pedidos do Dia
              </label>
              <input
                type="time"
                value={companyData.orderCutoffHour}
                onChange={e => setCompanyData({ ...companyData, orderCutoffHour: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                Configurações salvas com sucesso!
              </span>
            ) : <div />}

            <GlowButton type="submit" size="sm" disabled={loading}>
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </GlowButton>
          </div>
        </BentoCard>
      </form>

      {/* Card 3: Aparência & Tema */}
      <BentoCard className="p-6">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tema e Aparência
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize a experiência visual entre modo claro, escuro ou do sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              theme === 'light'
                ? 'border-[#2e7d32] bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-[#2e7d32]/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Sun className="w-5 h-5 text-amber-500" />
              {theme === 'light' && <Check className="w-4 h-4 text-[#2e7d32]" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Modo Claro</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fundo branco de alto contraste</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              theme === 'dark'
                ? 'border-[#2e7d32] bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-[#2e7d32]/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Moon className="w-5 h-5 text-blue-400" />
              {theme === 'dark' && <Check className="w-4 h-4 text-[#2e7d32]" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Modo Escuro</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tons escuros confortáveis para a visão</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              theme === 'system'
                ? 'border-[#2e7d32] bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-[#2e7d32]/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Laptop className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              {theme === 'system' && <Check className="w-4 h-4 text-[#2e7d32]" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Automático</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Segue a configuração do seu dispositivo</p>
            </div>
          </button>
        </div>
      </BentoCard>

      {/* Card 4: Segurança & Conta de Administrador */}
      <BentoCard className="p-6">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Conta de Administrador & Acessos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle da conta gestora e credenciais de login
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Usuário Autenticado</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {user?.email || 'admin@fitdali.com.br'}
            </p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Nível: Gestor Master
            </span>
          </div>

          <GlowButton
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordModal(true)}
          >
            <Key className="w-4 h-4 text-[#2e7d32]" />
            <span>Alterar Senha</span>
          </GlowButton>
        </div>
      </BentoCard>

      {/* Card 5: Banco de Dados & Exportação */}
      <BentoCard className="p-6">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Banco de Dados & Exportação de Dados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Status da infraestrutura Supabase e backup em planilha
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Supabase PostgreSQL (Ativo)
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Região: América do Sul (São Paulo) • Latência otimizada
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Backup de Pedidos
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exportar histórico em CSV
              </p>
            </div>
            <GlowButton variant="outline" size="sm" onClick={handleExportOrders}>
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </GlowButton>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3 sm:col-span-2">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Base de Clientes Cadastrados
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exportar contatos e endereços para planilha
              </p>
            </div>
            <GlowButton variant="outline" size="sm" onClick={handleExportCustomers}>
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Clientes</span>
            </GlowButton>
          </div>
        </div>
      </BentoCard>

      {/* Modal de Alteração de Senha */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Alterar Senha do Administrador"
        description="Defina uma nova senha de acesso ao painel gestor."
        maxWidth="md"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Senha atualizada com sucesso!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nova Senha (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton
              type="submit"
              size="sm"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Atualizando...' : 'Confirmar Nova Senha'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

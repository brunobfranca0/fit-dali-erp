'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/lib/types'
import { formatPhone } from '@/lib/utils'
import { Plus, Search, Phone, Mail, MapPin, Trash2, Edit, Users, AlertCircle } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('name')
    
    setCustomers(data || [])
    setLoading(false)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenCreateModal = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c)
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return

    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (!error) {
      setCustomers(prev => prev.filter(c => c.id !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Informe o nome do cliente.')
      return
    }

    setFormLoading(true)
    const supabase = createClient()

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(formData)
        if (error) throw error
      }

      setShowModal(false)
      loadCustomers()
    } catch (err: any) {
      setFormError('Erro ao salvar cliente: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-2 border-[#2e7d32] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Carregando base de clientes...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Base de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Contatos, endereços de entrega e preferências alimentares
          </p>
        </div>

        <GlowButton
          variant="primary"
          size="sm"
          onClick={handleOpenCreateModal}
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </GlowButton>
      </div>

      {/* Search */}
      <BentoCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, email ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-all"
          />
        </div>
      </BentoCard>

      {/* Grid de Clientes */}
      {filteredCustomers.length === 0 ? (
        <BentoCard className="p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm ? 'Tente outro termo de busca' : 'Cadastre o primeiro cliente da marmitaria'}
          </p>
          <GlowButton size="sm" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </GlowButton>
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <BentoCard key={customer.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#38a149] flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {customer.name}
                      </h3>
                      {customer.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{formatPhone(customer.phone)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(customer)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pb-3 border-b border-slate-100 dark:border-slate-800">
                  {customer.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                </div>

                {customer.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl mt-3 border border-slate-100 dark:border-slate-800">
                    &ldquo;{customer.notes}&rdquo;
                  </p>
                )}
              </div>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Modal de Cliente */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        description="Cadastre os dados de contato e endereço de entrega do cliente."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Juliana Mendes"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(35) 98888-0000"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@email.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endereço Completo de Entrega
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, complemento, bairro"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preferências & Restrições Alimentares
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Prefere marmitas Low Carb, sem lactose, entregar após as 18h"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={formLoading}>
              {formLoading ? 'Salvando...' : editingCustomer ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

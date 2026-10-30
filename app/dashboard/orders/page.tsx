'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, Category, Customer } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, calculatePrice, getLocalDateISO } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Phone,
  Trash2,
  CheckCircle,
  Clock,
  Package,
  Truck,
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import GlowButton from '@/components/kokonutui/glow-button'
import BentoCard from '@/components/kokonutui/bento-card'
import Modal from '@/components/ui/modal'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [canDeleteOrders, setCanDeleteOrders] = useState(false)

  // Order Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    delivery_date: getLocalDateISO(),
    payment_method: 'PIX',
    payment_status: 'paid',
    notes: '',
  })

  const [items, setItems] = useState<Array<{ category_id: string; quantity: number }>>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      const [ordersRes, categoriesRes, customersRes, userRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            customer:customers(*),
            order_items(*, category:categories(*))
          `)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('active', true),
        supabase.from('customers').select('*').order('name'),
        supabase.auth.getUser(),
      ])

      setOrders(ordersRes.data || [])
      setCategories(categoriesRes.data || [])
      setCustomers(customersRes.data || [])
      setCanDeleteOrders(['admin', 'gestor'].includes(userRes.data.user?.app_metadata?.role))

      if (categoriesRes.data && categoriesRes.data.length > 0 && items.length === 0) {
        setItems([{ category_id: categoriesRes.data[0].id, quantity: 10 }])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o))
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return

    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const category = categories.find(c => c.id === item.category_id)
      if (!category) return sum
      const price = calculatePrice(item.quantity, category.price_unit, category.price_c10, category.price_c20)
      return sum + price.total
    }, 0)
  }

  const handleCustomerSelect = (customerId: string) => {
    if (!customerId) {
      setFormData(prev => ({ ...prev, customer_id: '', customer_name: '', customer_phone: '' }))
      return
    }
    const found = customers.find(c => c.id === customerId)
    if (found) {
      setFormData(prev => ({
        ...prev,
        customer_id: found.id,
        customer_name: found.name,
        customer_phone: found.phone || '',
      }))
    }
  }

  const handleAddItem = () => {
    if (categories.length > 0) {
      setItems(prev => [...prev, { category_id: categories[0].id, quantity: 10 }])
    }
  }

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: 'category_id' | 'quantity', value: any) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.customer_name.trim()) {
      setFormError('Informe o nome do cliente.')
      return
    }

    if (items.length === 0) {
      setFormError('Adicione pelo menos um item ao pedido.')
      return
    }

    setModalLoading(true)
    const supabase = createClient()

    try {
      const total = calculateTotal()

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: formData.customer_id || null,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          order_date: getLocalDateISO(),
          delivery_date: formData.delivery_date,
          status: 'confirmed',
          payment_status: formData.payment_status,
          payment_method: formData.payment_method,
          subtotal: total,
          discount: 0,
          total,
          notes: formData.notes,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Create order items
      const orderItems = items.map(item => {
        const category = categories.find(c => c.id === item.category_id)!
        const price = calculatePrice(item.quantity, category.price_unit, category.price_c10, category.price_c20)
        
        return {
          order_id: order.id,
          category_id: item.category_id,
          product_name: category.name,
          quantity: item.quantity,
          unit_price: category.price_unit,
          subtotal: price.total,
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      setShowNewOrderModal(false)
      setFormData({
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        delivery_date: getLocalDateISO(),
        payment_method: 'PIX',
        payment_status: 'paid',
        notes: '',
      })
      loadData()
    } catch (err: any) {
      console.error(err)
      setFormError('Erro ao criar pedido: ' + err.message)
    } finally {
      setModalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-2 border-[#e60067] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Carregando pedidos...
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
            Gestão de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle de pedidos, status de entrega e faturamento
          </p>
        </div>

        <GlowButton
          variant="primary"
          size="sm"
          onClick={() => setShowNewOrderModal(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido</span>
        </GlowButton>
      </div>

      {/* Filters Bar */}
      <BentoCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, telefone ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067]"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Pronto</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </BentoCard>

      {/* Grid de Pedidos */}
      {filteredOrders.length === 0 ? (
        <BentoCard className="p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {searchTerm || statusFilter !== 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido cadastrado'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente remover os filtros de busca'
              : 'Clique no botão abaixo para registrar um novo pedido.'}
          </p>
          <GlowButton size="sm" onClick={() => setShowNewOrderModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Cadastrar Pedido</span>
          </GlowButton>
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <BentoCard key={order.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {order.customer_name}
                    </h3>
                    {order.customer_phone && (
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </p>
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 text-[10.5px] font-bold rounded-full border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Entrega: {formatDate(order.delivery_date)}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {order.payment_method || 'PIX'} ({order.payment_status === 'paid' ? 'Pago' : 'Pendente'})
                  </span>
                </div>

                {/* Itens */}
                <div className="space-y-1.5 mb-4">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.category?.color || '#e60067' }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.product_name}</span>
                        <span className="text-slate-400 font-mono">×{item.quantity}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl mb-4 border border-slate-100 dark:border-slate-800">
                    &ldquo;{order.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Total e Ações */}
              <div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total do Pedido</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Confirmar
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-semibold transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Preparar
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Pronto
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Entregar
                    </button>
                  )}
                  {canDeleteOrders && (
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Modal Moderno de Novo Pedido */}
      <Modal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        title="Cadastrar Novo Pedido"
        description="Selecione o cliente, adicione as linhas de marmitas e configure a entrega."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Dados do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente Cadastrado (Opcional)
              </label>
              <select
                value={formData.customer_id}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Novo Cliente / Entrada Manual</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Ex: Carlos Oliveira"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                value={formData.customer_phone}
                onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="(35) 98888-0000"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Marmitas / Linhas do Pedido
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-[#e60067] dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Linha
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <select
                      value={item.category_id}
                      onChange={e => handleItemChange(idx, 'category_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-36">
                    <select
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      <option value={1}>1 un (Avulso)</option>
                      <option value={5}>5 un</option>
                      <option value={10}>10 un (Combo 10)</option>
                      <option value={20}>20 un (Combo 20)</option>
                    </select>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Total Previsto:</span>
              <span className="text-base font-black font-mono text-[#e60067] dark:text-rose-400">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          {/* Entrega e Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Entrega
              </label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Método de Pagamento
              </label>
              <select
                value={formData.payment_method}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="PIX">PIX</option>
                <option value="Cartão">Cartão</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status do Pagamento
              </label>
              <select
                value={formData.payment_status}
                onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (pratos escolhidos pelo cliente, restrições)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: 5 frango cremoso, 5 carne de panela"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewOrderModal(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={modalLoading}>
              {modalLoading ? 'Salvando...' : 'Salvar Pedido'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

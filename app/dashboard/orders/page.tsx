'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, Category, Customer } from '@/lib/types'
import { formatCurrency, getStatusColor, getStatusLabel, calculatePrice } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Phone,
  MapPin,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  Package,
  Truck,
  X as XIcon
} from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      const [ordersRes, categoriesRes, customersRes] = await Promise.all([
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
      ])

      setOrders(ordersRes.data || [])
      setCategories(categoriesRes.data || [])
      setCustomers(customersRes.data || [])
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
      loadData()
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return

    const supabase = createClient()
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (!error) {
      loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os pedidos</p>
        </div>
        <button
          onClick={() => setShowNewOrderModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Pedido
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, telefone ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
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
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro pedido'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowNewOrderModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Pedido
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all animate-slide-up overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {order.customer_name}
                    </h3>
                    {order.customer_phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Phone className="w-3.5 h-3.5" />
                        {order.customer_phone}
                      </div>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.delivery_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6 space-y-2">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.category?.color }}
                      />
                      <span className="text-gray-900 font-medium">{item.product_name}</span>
                      <span className="text-gray-500">×{item.quantity}</span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-4">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                    >
                      <Clock className="w-4 h-4" />
                      Preparar
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <Package className="w-4 h-4" />
                      Pronto
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <Truck className="w-4 h-4" />
                      Entregar
                    </button>
                  )}
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <NewOrderModal
          categories={categories}
          customers={customers}
          onClose={() => setShowNewOrderModal(false)}
          onSuccess={() => {
            setShowNewOrderModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

// New Order Modal Component
function NewOrderModal({
  categories,
  customers,
  onClose,
  onSuccess,
}: {
  categories: Category[]
  customers: Customer[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [items, setItems] = useState<Array<{ category_id: string; quantity: number }>>([])
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    if (categories.length > 0) {
      setItems([...items, { category_id: categories[0].id, quantity: 10 }])
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const category = categories.find(c => c.id === item.category_id)
      if (!category) return sum
      const price = calculatePrice(item.quantity, category.price_unit, category.price_c10, category.price_c20)
      return sum + price.total
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      alert('Adicione pelo menos um item ao pedido')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const total = calculateTotal()

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...formData,
          order_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          payment_status: 'pending',
          subtotal: total,
          discount: 0,
          total,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
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

      onSuccess()
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Novo Pedido</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informações do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Entrega *
              </label>
              <input
                type="date"
                required
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Itens do Pedido</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Item
              </button>
            </div>

            {items.map((item, index) => {
              const category = categories.find(c => c.id === item.category_id)
              const price = category ? calculatePrice(item.quantity, category.price_unit, category.price_c10, category.price_c20) : null

              return (
                <div key={index} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Produto
                    </label>
                    <select
                      value={item.category_id}
                      onChange={(e) => updateItem(index, 'category_id', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qtd
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtotal
                    </label>
                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium">
                      {price ? formatCurrency(price.total) : 'R$ 0,00'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )
            })}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum item adicionado. Clique em "Adicionar Item" para começar.
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Total do Pedido</span>
            <span className="text-2xl font-bold text-pink-600">
              {formatCurrency(calculateTotal())}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

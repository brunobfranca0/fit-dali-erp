export interface Category {
  id: string
  name: string
  color: string
  price_unit: number
  price_c10: number
  price_c20: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  category_id: string
  name: string
  description?: string
  active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'partial'

export interface Order {
  id: string
  customer_id?: string
  customer_name: string
  customer_phone?: string
  order_date: string
  delivery_date: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method?: string
  subtotal: number
  discount: number
  total: number
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
  order_items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  category_id?: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
  category?: Category
  product?: Product
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: string
  payment_date: string
  notes?: string
  created_at: string
}

export interface DailyProduction {
  id: string
  production_date: string
  category_id: string
  product_id?: string
  quantity: number
  notes?: string
  created_at: string
  updated_at: string
  category?: Category
  product?: Product
}

export interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  payment_method?: string
  created_at: string
  updated_at: string
}

export interface DashboardMetrics {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  todayOrders: number
  averageTicket: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  revenueByDay: { date: string; revenue: number }[]
  ordersByStatus: { status: OrderStatus; count: number }[]
}

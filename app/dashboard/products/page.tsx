'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Trash2, Edit, X as XIcon, Package, Eye } from 'lucide-react'
import Image from 'next/image'

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showFlyerModal, setShowFlyerModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*, category:categories(*)').order('name'),
    ])

    setCategories(categoriesRes.data || [])
    setProducts(productsRes.data || [])
    setLoading(false)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Tem certeza? Produtos desta categoria serão afetados.')) return
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', id)
    loadData()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
  </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Produtos & Cardápio</h1>
          <p className="text-gray-600">Gerencie categorias, pratos do cardápio e precificação de combos</p>
    </div>
        <button
          onClick={() => setShowFlyerModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 text-[#e60067] rounded-xl text-sm font-semibold hover:bg-pink-50 transition-all shadow-sm"
        >
          <Eye className="w-4 h-4" />
          Ver Cardápio Impresso Oficial
        </button>
  </div>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
          <button
            onClick={() => {
              setEditingCategory(null)
              setShowCategoryModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
    </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name.charAt(0)}
            </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(category)
                      setShowCategoryModal(true)
                    }}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
            </div>
          </div>

              <h3 className="font-bold text-gray-900 text-lg mb-3">{category.name}</h3>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Unidade:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(category.price_unit)}</span>
            </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Combo 10:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(category.price_c10)}</span>
            </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Combo 20:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(category.price_c20)}</span>
            </div>
          </div>
        </div>
          ))}
    </div>
  </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowProductModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
    </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto cadastrado</h3>
            <p className="text-gray-600 mb-6">Comece adicionando produtos ao cardápio</p>
            <button
              onClick={() => setShowProductModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Adicionar Produto
            </button>
      </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: product.category?.color }}
                          />
                          <span className="text-sm text-gray-900">{product.category?.name}</span>
                    </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {product.description || '-'}
                    </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product)
                              setShowProductModal(true)
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                    </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        </div>
      </div>
        )}
  </div>

      {/* Modals */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
          onSuccess={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
            loadData()
          }}
        />
      )}

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
          onSuccess={() => {
            setShowProductModal(false)
            setEditingProduct(null)
            loadData()
          }}
        />
      )}

      {/* Modal Cardápio da Semana */}
      {showFlyerModal && (
        <div
          onClick={() => setShowFlyerModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl max-h-[90vh] w-full h-[85vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl cursor-default flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">Cardápio da Semana Oficial - Fit DaLi</span>
              <button
                onClick={() => setShowFlyerModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative flex-1 w-full bg-gray-50">
              <Image
                src="/brand/cardapio-semanal.jpg"
                alt="Cardápio da Semana Fit DaLi"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryModal({ category, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || '#e60067',
    price_unit: category?.price_unit || 18,
    price_c10: category?.price_c10 || 16,
    price_c20: category?.price_c20 || 15,
    active: category?.active ?? true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      if (category) {
        await supabase.from('categories').update(formData).eq('id', category.id)
      } else {
        await supabase.from('categories').insert(formData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Erro ao salvar categoria')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XIcon className="w-5 h-5" />
          </button>
    </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            />
      </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
      </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço Unit.</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_unit}
                onChange={(e) => setFormData({ ...formData, price_unit: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
              />
        </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Combo 10</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_c10}
                onChange={(e) => setFormData({ ...formData, price_c10: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
              />
        </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Combo 20</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_c20}
                onChange={(e) => setFormData({ ...formData, price_c20: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
              />
        </div>
      </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando...' : category ? 'Atualizar' : 'Criar'}
            </button>
      </div>
        </form>
  </div>
</div>
  )
}

function ProductModal({ product, categories, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category_id: product?.category_id || categories[0]?.id || '',
    description: product?.description || '',
    active: product?.active ?? true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      if (product) {
        await supabase.from('products').update(formData).eq('id', product.id)
      } else {
        await supabase.from('products').insert(formData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Erro ao salvar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XIcon className="w-5 h-5" />
          </button>
    </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            />
      </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            >
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
      </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none resize-none"
            />
      </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Produto ativo
            </label>
      </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando...' : product ? 'Atualizar' : 'Criar'}
            </button>
      </div>
        </form>
  </div>
</div>
  )
}

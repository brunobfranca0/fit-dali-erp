'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Trash2, Edit, X as XIcon, Package, Eye, Sparkles } from 'lucide-react'
import Image from 'next/image'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import KokonutBadge from '@/components/kokonutui/badge'

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
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-10 h-10 border-2 border-[#e60067] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Carregando cardápio...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Produtos & Cardápio
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Gerencie as linhas de marmitas, pratos da semana e preços dos combos
          </p>
        </div>
        <GlowButton
          variant="outline"
          size="sm"
          onClick={() => setShowFlyerModal(true)}
        >
          <Eye className="w-4 h-4 text-[#e60067]" />
          <span>Ver Cardápio Impresso</span>
        </GlowButton>
      </div>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Categorias & Combos</h2>
            <p className="text-xs text-gray-500 font-medium">Preços unitários e progressivos de 10 e 20 marmitas</p>
          </div>
          <GlowButton
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCategory(null)
              setShowCategoryModal(true)
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </GlowButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category) => (
            <BentoCard
              key={category.id}
              className="p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setShowCategoryModal(true)
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-gray-900 text-lg mb-1">{category.name}</h3>
                <p className="text-xs text-gray-400 mb-4 font-medium">Preços oficiais configurados:</p>

                <div className="space-y-2 bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Preço Unitário:</span>
                    <span className="font-bold text-gray-900 font-mono">{formatCurrency(Number(category.price_unit))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Combo 10 un:</span>
                    <span className="font-extrabold text-[#e60067] font-mono">{formatCurrency(Number(category.price_c10))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Combo 20 un:</span>
                    <span className="font-extrabold text-emerald-700 font-mono">{formatCurrency(Number(category.price_c20))}</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Pratos do Cardápio</h2>
            <p className="text-xs text-gray-500 font-medium">Receitas disponíveis para montagem dos pedidos</p>
          </div>
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingProduct(null)
              setShowProductModal(true)
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Prato</span>
          </GlowButton>
        </div>

        {products.length === 0 ? (
          <BentoCard className="p-12 text-center">
            <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">Nenhum prato cadastrado</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
              Adicione os pratos da semana ao cardápio para disponibilizá-los aos clientes.
            </p>
            <GlowButton
              size="sm"
              onClick={() => setShowProductModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeiro Prato</span>
            </GlowButton>
          </BentoCard>
        ) : (
          <BentoCard className="p-0 overflow-hidden" hoverEffect={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Prato / Descrição</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-0.5 max-w-lg line-clamp-1 font-medium">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gray-50 border border-gray-200/80 font-bold text-xs text-gray-800">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: product.category?.color || '#e60067' }}
                          />
                          <span>{product.category?.name}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.active ? (
                          <KokonutBadge variant="green" dot>
                            Ativo
                          </KokonutBadge>
                        ) : (
                          <KokonutBadge variant="gray">
                            Inativo
                          </KokonutBadge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(product)
                              setShowProductModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            title="Editar prato"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Excluir prato"
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
          </BentoCard>
        )}
      </div>

      {/* Modal Cardápio da Semana */}
      {showFlyerModal && (
        <div
          onClick={() => setShowFlyerModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl max-h-[90vh] w-full h-[85vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl cursor-default flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
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

      {/* Category Modal */}
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

      {/* Product Modal */}
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
    </div>
  )
}

function CategoryModal({ category, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || '#e60067',
    price_unit: category?.price_unit || 21.90,
    price_c10: category?.price_c10 || 199.00,
    price_c20: category?.price_c20 || 378.00,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-gray-900">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Nome da Categoria
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#e60067] outline-none"
              placeholder="Ex: Low Carb"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1"
              />
              <span className="font-mono text-xs text-gray-600 font-bold">{formData.color}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_unit}
                onChange={(e) => setFormData({ ...formData, price_unit: parseFloat(e.target.value) })}
                required
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#e60067] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Combo 10 (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_c10}
                onChange={(e) => setFormData({ ...formData, price_c10: parseFloat(e.target.value) })}
                required
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#e60067] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Combo 20 (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_c20}
                onChange={(e) => setFormData({ ...formData, price_c20: parseFloat(e.target.value) })}
                required
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#e60067] outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50"
            >
              Cancelar
            </button>
            <GlowButton
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : category ? 'Salvar Alterações' : 'Criar Categoria'}
            </GlowButton>
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-gray-900">
            {product ? 'Editar Prato' : 'Novo Prato no Cardápio'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Nome do Prato
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#e60067] outline-none"
              placeholder="Ex: Frango ao Molho de Laranja e Gengibre"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Categoria
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#e60067] outline-none"
            >
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Descrição & Acompanhamentos
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#e60067] outline-none resize-none"
              placeholder="Ex: Peito de frango grelhado ao molho natural de laranja, arroz branco soltinho e seleta de legumes."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-[#e60067] border-gray-300 rounded focus:ring-[#e60067]"
            />
            <label htmlFor="active" className="text-xs font-bold text-gray-700 cursor-pointer">
              Disponível no cardápio ativo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50"
            >
              Cancelar
            </button>
            <GlowButton
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : product ? 'Salvar Alterações' : 'Adicionar ao Cardápio'}
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Trash2, Edit, Package, AlertCircle, UtensilsCrossed } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#2e7d32',
    price_unit: 24.9,
    price_c10: 239.0,
    price_c20: 458.0,
  })

  // Product Modal
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    description: '',
    active: true,
  })

  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*, category:categories(*)').order('name'),
      ])

      const cats = categoriesRes.data || []
      setCategories(cats)
      setProducts(productsRes.data || [])

      if (cats.length > 0 && !productForm.category_id) {
        setProductForm(prev => ({ ...prev, category_id: cats[0].id }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = categoryFilter === 'all' || p.category_id === categoryFilter
    return matchesSearch && matchesCat
  })

  const handleOpenCreateCategory = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      color: '#2e7d32',
      price_unit: 24.9,
      price_c10: 239.0,
      price_c20: 458.0,
    })
    setFormError('')
    setShowCategoryModal(true)
  }

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryForm({
      name: cat.name,
      color: cat.color || '#2e7d32',
      price_unit: Number(cat.price_unit),
      price_c10: Number(cat.price_c10),
      price_c20: Number(cat.price_c20),
    })
    setFormError('')
    setShowCategoryModal(true)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Tem certeza? Pratos vinculados a esta categoria serão afetados.')) return
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', id)
    loadData()
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!categoryForm.name.trim()) {
      setFormError('Informe o nome da categoria.')
      return
    }

    setFormLoading(true)
    const supabase = createClient()

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryForm)
          .eq('id', editingCategory.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryForm)
        if (error) throw error
      }
      setShowCategoryModal(false)
      loadData()
    } catch (err: any) {
      setFormError('Erro ao salvar categoria: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleOpenCreateProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      active: true,
    })
    setFormError('')
    setShowProductModal(true)
  }

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod)
    setProductForm({
      name: prod.name,
      category_id: prod.category_id,
      description: prod.description || '',
      active: prod.active,
    })
    setFormError('')
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este prato?')) return
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    loadData()
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!productForm.name.trim()) {
      setFormError('Informe o nome do prato.')
      return
    }

    setFormLoading(true)
    const supabase = createClient()

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productForm)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productForm)
        if (error) throw error
      }
      setShowProductModal(false)
      loadData()
    } catch (err: any) {
      setFormError('Erro ao salvar prato: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-2 border-[#2e7d32] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Carregando cardápio...
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
            Cardápio & Preços
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure as linhas de marmitas, valores dos combos e receitas semanais
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <GlowButton
            variant="outline"
            size="sm"
            onClick={handleOpenCreateCategory}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Linha</span>
          </GlowButton>
          <GlowButton
            variant="primary"
            size="sm"
            onClick={handleOpenCreateProduct}
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Prato</span>
          </GlowButton>
        </div>
      </div>

      {/* Grid de Linhas / Categorias */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Linhas Oficiais & Preços dos Combos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((category) => (
            <BentoCard key={category.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                      {category.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCategory(category)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                      title="Editar Preços"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Unidade Avulsa:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(Number(category.price_unit))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Combo 10 un:</span>
                    <span className="font-extrabold text-[#2e7d32] dark:text-emerald-300 font-mono">
                      {formatCurrency(Number(category.price_c10))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Combo 20 un:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(Number(category.price_c20))}
                    </span>
                  </div>
                </div>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* Tabela de Pratos do Cardápio */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pratos Cadastrados ({filteredProducts.length})
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar pratos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="all">Todas as Linhas</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <BentoCard className="p-0 overflow-hidden" hoverEffect={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Linha</th>
                  <th className="py-3 px-4">Prato / Descrição</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold"
                        style={{
                          backgroundColor: `${product.category?.color || '#2e7d32'}15`,
                          color: product.category?.color || '#2e7d32',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: product.category?.color || '#2e7d32' }}
                        />
                        {product.category?.name || 'Marmita'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.active
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {product.active ? 'Disponível' : 'Indisponível'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* Modal de Linha / Categoria */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Editar Linha' : 'Nova Linha de Marmitas'}
        description="Defina os preços unitários e dos combos de 10 e 20 marmitas."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-3.5">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Linha *
            </label>
            <input
              type="text"
              required
              value={categoryForm.name}
              onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="Ex: Vegetariana"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Avulso (R$)
              </label>
              <input
                type="number"
                step="0.10"
                value={categoryForm.price_unit}
                onChange={e => setCategoryForm({ ...categoryForm, price_unit: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Combo 10 (R$)
              </label>
              <input
                type="number"
                step="1.00"
                value={categoryForm.price_c10}
                onChange={e => setCategoryForm({ ...categoryForm, price_c10: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Combo 20 (R$)
              </label>
              <input
                type="number"
                step="1.00"
                value={categoryForm.price_c20}
                onChange={e => setCategoryForm({ ...categoryForm, price_c20: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={categoryForm.color}
                onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
              />
              <span className="text-xs font-mono text-slate-500">{categoryForm.color}</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryModal(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={formLoading}>
              {formLoading ? 'Salvando...' : 'Salvar Linha'}
            </GlowButton>
          </div>
        </form>
      </Modal>

      {/* Modal de Prato */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Editar Prato' : 'Novo Prato no Cardápio'}
        description="Cadastre um sabor de marmita vinculado a uma das linhas."
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-3.5">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Linha da Marmita *
            </label>
            <select
              value={productForm.category_id}
              onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Prato *
            </label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="Ex: Frango cremoso com legumes"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição / Ingredientes
            </label>
            <textarea
              rows={2}
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Ex: Peito de frango em cubos, creme leve de ricota, brócolis e cenoura"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="active"
              checked={productForm.active}
              onChange={e => setProductForm({ ...productForm, active: e.target.checked })}
              className="rounded text-[#2e7d32] focus:ring-[#2e7d32]"
            />
            <label htmlFor="active" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prato ativo para pedidos da semana
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProductModal(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={formLoading}>
              {formLoading ? 'Salvando...' : 'Salvar Prato'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

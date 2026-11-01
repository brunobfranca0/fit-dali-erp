'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Trash2, Edit, UtensilsCrossed } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'
import { useFeedback } from '@/components/ui/feedback'
import { Field, FormError, inputClass } from '@/components/ui/form'
import { EmptyState, PageHeader, PageSkeleton } from '@/components/ui/page'

function comboDetails(comboPrice: number, size: number, unitPrice: number) {
  const perUnit = comboPrice / size
  const savingsPct = unitPrice > 0 ? Math.round((1 - perUnit / unitPrice) * 100) : 0
  return { perUnit, savingsPct }
}

const CATEGORY_COLOR_PRESETS = [
  { name: 'Rosa', value: '#e60067' },
  { name: 'Verde Fit', value: '#2e7d32' },
  { name: 'Verde claro', value: '#38a149' },
  { name: 'Oliva', value: '#689f38' },
  { name: 'Azul', value: '#2563eb' },
  { name: 'Roxo', value: '#7c3aed' },
  { name: 'Laranja', value: '#ea580c' },
  { name: 'Grafite', value: '#475569' },
]

export default function ProductsPage() {
  const { toast, confirm } = useFeedback()
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

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*, category:categories(*)').order('name'),
      ])

      if (categoriesRes.error || productsRes.error) {
        toast('error', 'Não foi possível carregar o cardápio', (categoriesRes.error || productsRes.error)?.message)
      }

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

  useEffect(() => {
    // Initial fetch from Supabase on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleDeleteCategory = async (category: Category) => {
    const linkedProducts = products.filter(p => p.category_id === category.id).length
    const confirmed = await confirm({
      title: `Excluir a linha "${category.name}"?`,
      description: linkedProducts > 0
        ? `${linkedProducts} prato(s) vinculado(s) também serão removidos. Pedidos antigos mantêm o histórico.`
        : 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir linha',
      destructive: true,
    })
    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (error) {
      toast('error', 'Não foi possível excluir a linha', error.message)
      return
    }
    toast('success', 'Linha excluída')
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
      toast('success', editingCategory ? 'Linha atualizada' : 'Linha criada')
      loadData()
    } catch (err) {
      setFormError('Erro ao salvar categoria: ' + ((err as { message?: string })?.message || 'tente novamente.'))
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

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = await confirm({
      title: `Excluir "${product.name}"?`,
      description: 'Se preferir manter o histórico, apenas marque o prato como indisponível.',
      confirmLabel: 'Excluir prato',
      destructive: true,
    })
    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      toast('error', 'Não foi possível excluir o prato', error.message)
      return
    }
    setProducts(prev => prev.filter(p => p.id !== product.id))
    toast('success', 'Prato excluído')
  }

  const handleToggleProduct = async (product: Product) => {
    const active = !product.active
    setProducts(prev => prev.map(p => (p.id === product.id ? { ...p, active } : p)))

    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', product.id)

    if (error) {
      setProducts(prev => prev.map(p => (p.id === product.id ? { ...p, active: product.active } : p)))
      toast('error', 'Não foi possível alterar a disponibilidade', error.message)
      return
    }
    toast('success', active ? 'Prato disponível para pedidos' : 'Prato marcado como indisponível')
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
      toast('success', editingProduct ? 'Prato atualizado' : 'Prato cadastrado')
      loadData()
    } catch (err) {
      setFormError('Erro ao salvar prato: ' + ((err as { message?: string })?.message || 'tente novamente.'))
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return <PageSkeleton cards={3} />
  }

  const activeProductsCount = products.filter(p => p.active).length

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        title="Cardápio & Preços"
        description="Configure as linhas de marmitas, valores dos combos e receitas semanais"
        actions={
          <>
            <GlowButton variant="outline" size="sm" onClick={handleOpenCreateCategory}>
              <Plus className="w-4 h-4" />
              <span>Nova Linha</span>
            </GlowButton>
            <GlowButton variant="primary" size="sm" onClick={handleOpenCreateProduct} disabled={categories.length === 0}>
              <Plus className="w-4 h-4" />
              <span>Cadastrar Prato</span>
            </GlowButton>
          </>
        }
      />

      {/* Grid de Linhas / Categorias */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Categorias e preços dos combos
        </h2>
        {categories.length === 0 ? (
          <BentoCard className="p-0" hoverEffect={false}>
            <EmptyState
              icon={UtensilsCrossed}
              title="Nenhuma linha cadastrada"
              description="Crie uma linha (ex.: Low Carb) com os preços avulso e dos combos para começar a montar o cardápio."
              action={
                <GlowButton size="sm" onClick={handleOpenCreateCategory}>
                  <Plus className="w-4 h-4" />
                  <span>Criar primeira linha</span>
                </GlowButton>
              }
            />
          </BentoCard>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((category) => {
            const unitPrice = Number(category.price_unit)
            const combos = [
              { label: 'Combo 10 un', size: 10, price: Number(category.price_c10) },
              { label: 'Combo 20 un', size: 20, price: Number(category.price_c20) },
            ]
            const dishCount = products.filter(p => p.category_id === category.id).length
            return (
            <BentoCard key={category.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base truncate">
                        {category.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{dishCount} prato(s) no cardápio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(category)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar categoria"
                      aria-label={`Editar linha ${category.name}`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir"
                      aria-label={`Excluir linha ${category.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Unidade avulsa</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(unitPrice)}
                    </span>
                  </div>
                  {combos.map(combo => {
                    const { perUnit, savingsPct } = comboDetails(combo.price, combo.size, unitPrice)
                    return (
                      <div key={combo.size} className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{combo.label}</span>
                          <p className="text-[10.5px] text-slate-400 font-mono">{formatCurrency(perUnit)}/un</p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-[#2e7d32] dark:text-emerald-300 font-mono">
                            {formatCurrency(combo.price)}
                          </span>
                          {savingsPct > 0 && (
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {savingsPct}% de economia
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </BentoCard>
            )
          })}
        </div>
        )}
      </div>

      {/* Tabela de Pratos do Cardápio */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pratos Cadastrados ({filteredProducts.length})
            <span className="ml-2 normal-case tracking-normal font-semibold text-emerald-600 dark:text-emerald-400">
              {activeProductsCount} disponíveis
            </span>
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar pratos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Filtrar pratos"
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32]"
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
                  <th className="py-3 px-4">Categoria</th>
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
                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.active}
                        aria-label={`${product.active ? 'Desativar' : 'Ativar'} ${product.name}`}
                        title="Clique para alternar a disponibilidade"
                        onClick={() => handleToggleProduct(product)}
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          product.active
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`relative h-3.5 w-6 rounded-full transition-colors ${
                            product.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-xs transition-all ${
                              product.active ? 'left-3' : 'left-0.5'
                            }`}
                          />
                        </span>
                        {product.active ? 'Disponível' : 'Indisponível'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar"
                          aria-label={`Editar ${product.name}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Excluir"
                          aria-label={`Excluir ${product.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={UtensilsCrossed}
                        title={searchTerm || categoryFilter !== 'all' ? 'Nenhum prato encontrado' : 'Nenhum prato cadastrado'}
                        description={searchTerm || categoryFilter !== 'all' ? 'Ajuste a busca ou o filtro de linha.' : 'Cadastre os sabores do cardápio da semana.'}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* Modal de Linha / Categoria */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Editar categoria' : 'Nova categoria'}
        description="Defina os preços unitários e dos combos de 10 e 20 marmitas."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-3.5">
          <FormError message={formError} />

          <Field label="Nome da categoria *" htmlFor="category-name">
            <input
              id="category-name"
              type="text"
              required
              value={categoryForm.name}
              onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="Ex: Vegetariana"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Avulso (R$)" htmlFor="category-price-unit">
              <input
                id="category-price-unit"
                type="number"
                min="0"
                step="0.01"
                value={categoryForm.price_unit}
                onChange={e => setCategoryForm({ ...categoryForm, price_unit: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Combo 10 (R$)" htmlFor="category-price-c10">
              <input
                id="category-price-c10"
                type="number"
                min="0"
                step="0.01"
                value={categoryForm.price_c10}
                onChange={e => setCategoryForm({ ...categoryForm, price_c10: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Combo 20 (R$)" htmlFor="category-price-c20">
              <input
                id="category-price-c20"
                type="number"
                min="0"
                step="0.01"
                value={categoryForm.price_c20}
                onChange={e => setCategoryForm({ ...categoryForm, price_c20: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>

          {categoryForm.price_unit > 0 && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { size: 10, price: categoryForm.price_c10 },
                { size: 20, price: categoryForm.price_c20 },
              ].map(combo => {
                const { perUnit, savingsPct } = comboDetails(combo.price, combo.size, categoryForm.price_unit)
                return (
                  <div
                    key={combo.size}
                    className={`rounded-xl border px-3 py-2 ${
                      savingsPct < 0
                        ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">Combo {combo.size}:</span>{' '}
                    <span className="font-mono">{formatCurrency(perUnit)}/un</span>
                    <span className="block font-bold">
                      {savingsPct < 0 ? 'Mais caro que o avulso!' : `${savingsPct}% de economia`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cor da categoria
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Escolher qualquer cor para a categoria"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="text"
                  aria-label="Código hexadecimal da cor"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Use o formato hexadecimal, por exemplo #e60067"
                  required
                  className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-800 outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#2e7d32]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">Escolha na paleta ou informe outra cor.</span>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Paleta sugerida">
                {CATEGORY_COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    aria-label={`Usar cor ${preset.name}`}
                    aria-pressed={categoryForm.color.toLowerCase() === preset.value}
                    title={preset.name}
                    onClick={() => setCategoryForm({ ...categoryForm, color: preset.value })}
                    className={`h-7 w-7 rounded-full border border-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${categoryForm.color.toLowerCase() === preset.value ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white' : ''}`}
                    style={{ backgroundColor: preset.value }}
                  />
                ))}
              </div>
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
              {formLoading ? 'Salvando...' : 'Salvar categoria'}
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
          <FormError message={formError} />

          <Field label="Linha da Marmita *" htmlFor="product-category">
            <select
              id="product-category"
              value={productForm.category_id}
              onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
              className={inputClass}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nome do Prato *" htmlFor="product-name">
            <input
              id="product-name"
              type="text"
              required
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="Ex: Frango cremoso com legumes"
              className={inputClass}
            />
          </Field>

          <Field label="Descrição / Ingredientes" htmlFor="product-description">
            <textarea
              id="product-description"
              rows={2}
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Ex: Peito de frango em cubos, creme leve de ricota, brócolis e cenoura"
              className={inputClass}
            />
          </Field>

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

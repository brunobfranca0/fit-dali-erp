// TypeScript / components/dashboard/command-palette.tsx / React / Fit Dali ERP browser UI
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CommandItem {
  id: string
  label: string
  hint?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  keywords?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  items: CommandItem[]
}

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo<CommandItem[]>(() => {
    const term = normalize(query.trim())
    const matches = term
      ? items.filter(item => normalize(`${item.label} ${item.hint ?? ''} ${item.keywords ?? ''}`).includes(term))
      : items
    if (!term) return matches
    // Free-text search falls through to the orders and customers lists.
    return [
      ...matches,
      { id: 'search-orders', label: `Buscar "${query.trim()}" em pedidos`, href: `/dashboard/orders?q=${encodeURIComponent(query.trim())}`, icon: Search },
      { id: 'search-customers', label: `Buscar "${query.trim()}" em clientes`, href: `/dashboard/customers?q=${encodeURIComponent(query.trim())}`, icon: Search },
    ]
  }, [items, query])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const close = () => {
    setQuery('')
    setActiveIndex(0)
    onClose()
  }

  const run = (item: CommandItem) => {
    close()
    router.push(item.href)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(index => (index + 1) % Math.max(results.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index => (index - 1 + results.length) % Math.max(results.length, 1))
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault()
      run(results[activeIndex])
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center p-4 pt-[12vh] animate-fade-in print:hidden" onKeyDown={handleKeyDown}>
      <button
        type="button"
        aria-label="Fechar busca"
        tabIndex={-1}
        className="fixed inset-0 bg-slate-950/45 dark:bg-black/65"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca rápida"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-scale-in dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={event => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            placeholder="Ir para módulo, ação ou buscar pedido/cliente..."
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={results[activeIndex] ? `command-${results[activeIndex].id}` : undefined}
            className="h-14 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700">ESC</kbd>
        </div>

        <ul id="command-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-xs text-slate-400">Nada encontrado.</li>
          )}
          {results.map((item, index) => {
            const Icon = item.icon
            const active = index === activeIndex
            return (
              <li
                key={item.id}
                id={`command-${item.id}`}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => run(item)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold',
                  active
                    ? 'bg-emerald-50 text-[#2e7d32] dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active ? '' : 'text-slate-400')} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && <span className="text-[11px] font-medium text-slate-400">{item.hint}</span>}
                {active && <CornerDownLeft className="h-3.5 w-3.5 opacity-70" />}
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2 text-[10px] font-medium text-slate-400 dark:border-slate-800">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span className="ml-auto flex items-center gap-1"><Plus className="h-3 w-3" /> dica: digite “novo”</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette

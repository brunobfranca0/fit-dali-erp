// TypeScript / components/ui/form.tsx / React / Fit Dali ERP browser UI
import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const inputClass =
  'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] transition-colors disabled:opacity-60'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

export function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

interface SegmentedOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedProps<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

/** Horizontal pill tabs used for quick filters. Scrolls sideways on small screens. */
export function Segmented<T extends string>({ value, options, onChange, ariaLabel, className }: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'bg-[#2e7d32] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            )}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-md px-1.5 py-px font-mono text-[10px] font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

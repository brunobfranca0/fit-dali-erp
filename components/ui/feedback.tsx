// TypeScript / components/ui/feedback.tsx / React / Fit Dali ERP browser UI
'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import Modal from '@/components/ui/modal'
import GlowButton from '@/components/kokonutui/glow-button'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface FeedbackContextValue {
  toast: (tone: ToastTone, title: string, description?: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

const TOAST_DURATION_MS = 4200

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: XCircle, className: 'text-rose-600 dark:text-rose-400' },
  info: { icon: Info, className: 'text-blue-600 dark:text-blue-400' },
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const toast = useCallback((tone: ToastTone, title: string, description?: string) => {
    const id = ++nextId.current
    setToasts(prev => [...prev.slice(-3), { id, tone, title, description }])
    window.setTimeout(() => dismiss(id), TOAST_DURATION_MS)
  }, [dismiss])

  const confirm = useCallback((options: ConfirmOptions) => {
    resolverRef.current?.(false)
    setConfirmState(options)
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve
    })
  }, [])

  const settleConfirm = (value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setConfirmState(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end print:hidden"
      >
        {toasts.map(item => {
          const { icon: Icon, className } = TONE_STYLES[item.tone]
          return (
            <div
              key={item.id}
              role={item.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900"
            >
              <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', className)} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() => dismiss(item.id)}
                className="-m-1 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      <Modal isOpen={!!confirmState} onClose={() => settleConfirm(false)} maxWidth="sm">
        {confirmState && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl',
                  confirmState.destructive
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{confirmState.title}</h3>
                {confirmState.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{confirmState.description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <GlowButton type="button" variant="outline" size="sm" onClick={() => settleConfirm(false)}>
                {confirmState.cancelLabel || 'Voltar'}
              </GlowButton>
              <GlowButton
                type="button"
                size="sm"
                onClick={() => settleConfirm(true)}
                className={confirmState.destructive ? '!bg-none bg-rose-600 hover:bg-rose-700' : undefined}
              >
                {confirmState.confirmLabel || 'Confirmar'}
              </GlowButton>
            </div>
          </div>
        )}
      </Modal>
    </FeedbackContext.Provider>
  )
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider')
  return context
}

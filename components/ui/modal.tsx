// TypeScript / components/ui/modal.tsx / React / Fit Dali ERP browser UI
'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const EXIT_DURATION_MS = 160
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const isOpenRef = useRef(isOpen)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  isOpenRef.current = isOpen

  useEffect(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)

    if (isOpen) {
      setShouldRender(true)
      const frame = window.requestAnimationFrame(() => setIsVisible(true))
      return () => window.cancelAnimationFrame(frame)
    }

    setIsVisible(false)
    if (!shouldRender) return
    closeTimerRef.current = setTimeout(() => setShouldRender(false), EXIT_DURATION_MS)
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [isOpen, shouldRender])

  useEffect(() => {
    if (!shouldRender) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isOpenRef.current) onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (!focusable?.length) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(firstFocusable ?? dialogRef.current)?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(focusFrame)
      previousFocus?.focus()
    }
  }, [shouldRender])

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth]

  if (!shouldRender) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 transition-opacity duration-150 ease-out motion-reduce:transition-none sm:p-6 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <button
        type="button"
        aria-label="Fechar janela"
        tabIndex={-1}
        className="fixed inset-0 border-0 bg-slate-950/45 p-0 dark:bg-black/65"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : 'Janela de diálogo'}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 my-8 w-full ${maxWidthClasses} overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl transition-[opacity,transform] duration-150 ease-out dark:border-slate-800 dark:bg-slate-900 motion-reduce:transition-none ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-[0.99] opacity-0'}`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-4 dark:border-slate-800/80">
            <div>
              {title && <h3 id={titleId} className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>}
              {description && <p id={descriptionId} className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="Fechar janela"
              onClick={onClose}
              className="-mr-1.5 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="max-h-[calc(85vh-8rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal

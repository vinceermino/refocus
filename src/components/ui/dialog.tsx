'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const DialogContext = React.createContext('')

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const id = React.useId()

  React.useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const trigger = document.activeElement
    const overflow = document.body.style.overflow
    dialog.showModal()
    if (document.getElementById(`${id}-description`)) {
      dialog.setAttribute('aria-describedby', `${id}-description`)
    }
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [open, id])

  return (
    <DialogContext.Provider value={id}>
      <dialog
        ref={ref}
        aria-labelledby={`${id}-title`}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        onCancel={(event) => { event.preventDefault(); onOpenChange(false) }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onOpenChange(false)
        }}
      >
        {open && children}
      </dialog>
    </DialogContext.Provider>
  )
}

export function DialogContent({
  className,
  children,
  onClose,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-border bg-card p-5 sm:p-6',
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 mb-4 pr-8', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const id = React.useContext(DialogContext)
  return <h2 id={`${id}-title`} className={cn('text-lg font-semibold', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const id = React.useContext(DialogContext)
  return <p id={`${id}-description`} className={cn('text-sm text-muted-foreground', className)} {...props} />
}

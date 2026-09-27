'use client'

import { useState } from 'react'
import { Check, Flower2, Leaf } from 'lucide-react'
import { useAccent } from '@/components/providers/accent-provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function StyleSelector() {
  const { accent, setAccent } = useAccent()
  const [open, setOpen] = useState(false)

  return (
    <div className="minimal-optional">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}
        title="Choose your style" aria-label="Choose your style" aria-haspopup="dialog" aria-expanded={open}>
        {accent === 'pink' ? <Flower2 className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Choose your style</DialogTitle>
            <DialogDescription>A space that feels like you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { value: 'pink' as const, label: 'She', description: 'Sakura & rice paper', color: 'bg-[#FFB7C5]' },
              { value: 'dark' as const, label: 'He', description: 'Indigo ink & bamboo', color: 'bg-[#1F2A44]' },
            ].map(option => (
              <button key={option.value} type="button" aria-pressed={accent === option.value}
                onClick={() => { setAccent(option.value); setOpen(false) }}
                className={cn('theme-option flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-opacity',
                  accent === option.value ? 'bg-accent-primary/10 text-accent-primary' : 'hover:bg-muted')}>
                <span aria-hidden="true" className={cn('h-6 w-6 shrink-0 rounded-full', option.color)} />
                <span className="flex-1"><span className="block font-medium">{option.label}</span><span className="text-xs text-muted-foreground">{option.description}</span></span>
                {accent === option.value && <Check aria-hidden="true" className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

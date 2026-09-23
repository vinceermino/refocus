'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useStoredValue } from '@/hooks/use-stored-value'

const MinimalModeContext = createContext({ minimal: false, toggle: () => {} })

export function MinimalModeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useStoredValue('refocus-minimal-mode')
  const minimal = stored === 'true'
  useEffect(() => { document.documentElement.dataset.minimal = String(minimal) }, [minimal])
  return <MinimalModeContext.Provider value={{ minimal, toggle: () => setStored(String(!minimal)) }}>{children}</MinimalModeContext.Provider>
}

export function useMinimalMode() { return useContext(MinimalModeContext) }

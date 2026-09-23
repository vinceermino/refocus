import type { ReactNode } from 'react'

// Use the same root preference as the layout, including in Server Components.
export function MinimalModeText({ children, short }: { children: ReactNode; short: string }) {
  return <>
    <span className="minimal-optional">{children}</span>
    <span className="minimal-only">{short}</span>
  </>
}

import { Navbar } from '@/components/layout/navbar'
import { AuthNavbar } from './auth-navbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

import { AuthNavbar } from './auth-navbar'
import { UserDataProvider } from '@/components/providers/user-data-provider'
import { getUserData } from '@/lib/actions/user-data'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const result = await getUserData()
  
  // We can optionally redirect or just pass null if there's an error. 
  // UserDataProvider handles the null initialData case gracefully.
  const initialData = result.data ? result.data : null

  return (
    <div className="min-h-screen flex flex-col">
      <UserDataProvider initialData={initialData}>
        <AuthNavbar />
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>
      </UserDataProvider>
    </div>
  )
}

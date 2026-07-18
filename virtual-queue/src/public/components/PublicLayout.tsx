import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { PublicNavbar } from './PublicNavbar'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

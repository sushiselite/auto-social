'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Sidebar, TopBar } from '@/components/ui/Navigation'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  actions 
}) => {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Auto-generate title from pathname if not provided
  const autoTitle = title || (() => {
    const path = pathname.split('/').pop()
    if (path === 'dashboard') return 'Dashboard'
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard'
  })()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-gray-600 animate-pulse-subtle">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <TopBar 
          title={autoTitle}
          subtitle={subtitle}
          actions={actions}
        />

        {/* Page content */}
        <main className="min-h-[calc(100vh-64px)]">
          <div className="section-padding content-padding">
            <div className="mx-auto max-w-7xl animate-fade-in-up">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 
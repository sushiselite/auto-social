'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  BarChart3, 
  Settings, 
  Mic,
  LogOut,
  Menu,
  X,
  Sparkles,
  Bell,
  User
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    description: 'Overview and recent activity'
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    description: 'Performance metrics and insights'
  },
  { 
    name: 'Training', 
    href: '/dashboard/training', 
    icon: Mic,
    description: 'Improve your AI agent'
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    description: 'Preferences and configuration'
  },
]

interface SidebarProps {
  className?: string
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="btn-ghost p-2 rounded-lg shadow-sm bg-white border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-out lg:translate-x-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        className
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Auto Social</h1>
                <p className="text-xs text-gray-500">AI-Powered</p>
              </div>
            </div>
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r animate-scale-in" />
                  )}
                  
                  <Icon 
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive 
                        ? 'text-indigo-600' 
                        : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className={cn(
                    'absolute inset-0 rounded-xl border-2 border-transparent transition-colors duration-200',
                    !isActive && 'group-hover:border-gray-100'
                  )} />
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-all duration-200 group"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Top bar for notifications and quick actions
interface TopBarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export const TopBar = ({ title, subtitle, actions }: TopBarProps) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-gray-600 text-sm mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
          
          {actions}
        </div>
      </div>
    </div>
  )
}

// Breadcrumb navigation
interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav className={cn('flex items-center text-sm space-x-2', className)}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span className="text-gray-400">/</span>
          )}
          {item.href ? (
            <Link 
              href={item.href}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
} 
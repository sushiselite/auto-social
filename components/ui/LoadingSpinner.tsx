'use client'

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-solid border-current',
  {
    variants: {
      variant: {
        default: 'border-gray-300 border-t-gray-700',
        primary: 'border-indigo-200 border-t-indigo-600',
        white: 'border-white/30 border-t-white',
        success: 'border-green-200 border-t-green-600',
        warning: 'border-yellow-200 border-t-yellow-600',
        destructive: 'border-red-200 border-t-red-600',
      },
      size: {
        xs: 'h-3 w-3 border',
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8 border-[3px]',
        xl: 'h-12 w-12 border-[3px]',
        '2xl': 'h-16 w-16 border-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
  label?: string
}

export const LoadingSpinner = ({ 
  variant, 
  size, 
  className,
  label = 'Loading...'
}: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      <div className={cn(spinnerVariants({ variant, size }), className)} />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// Skeleton components for better loading states
interface SkeletonProps {
  className?: string
  variant?: 'default' | 'shimmer'
  children?: React.ReactNode
}

export const Skeleton = ({ 
  className, 
  variant = 'default',
  children,
  ...props 
}: SkeletonProps) => {
  return (
    <div
      className={cn(
        'rounded-md bg-muted',
        variant === 'shimmer' ? 'shimmer' : 'animate-pulse',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Page loading wrapper
interface PageLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export const PageLoading = ({ 
  size = 'lg', 
  message = 'Loading...',
  className 
}: PageLoadingProps) => {
  const sizeMap = {
    sm: 'h-32',
    md: 'h-64',
    lg: 'h-96'
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-4',
      sizeMap[size],
      className
    )}>
      <LoadingSpinner size="xl" variant="primary" />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse-subtle">
          {message}
        </p>
      )}
    </div>
  )
}

// Card skeleton for content loading
export const CardSkeleton = () => {
  return (
    <div className="card space-y-4">
      <Skeleton className="h-4 w-3/4" variant="shimmer" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" variant="shimmer" />
        <Skeleton className="h-3 w-5/6" variant="shimmer" />
        <Skeleton className="h-3 w-4/6" variant="shimmer" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-md" variant="shimmer" />
        <Skeleton className="h-8 w-20 rounded-md" variant="shimmer" />
      </div>
    </div>
  )
}

// Button loading state
interface ButtonLoadingProps {
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export const ButtonLoading = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  className,
  disabled,
  onClick,
  ...props
}: ButtonLoadingProps) => {
  return (
    <button
      className={cn(
        'btn-primary btn-md relative',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" variant="white" />
          {loadingText && (
            <span className="ml-2 text-sm">{loadingText}</span>
          )}
        </div>
      )}
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  )
}

// Table skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-2 border-b">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
} 
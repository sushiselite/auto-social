'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoadingSpinner } from './LoadingSpinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow-md',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
        ghost: 'hover:bg-gray-100 active:bg-gray-200',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100',
        success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800',
      },
      size: {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <LoadingSpinner 
              size="sm" 
              variant={variant === 'primary' ? 'white' : 'default'} 
            />
            {loadingText && (
              <span className="ml-2">{loadingText}</span>
            )}
          </div>
        )}
        <span className={loading ? 'invisible' : 'visible'}>
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants } 
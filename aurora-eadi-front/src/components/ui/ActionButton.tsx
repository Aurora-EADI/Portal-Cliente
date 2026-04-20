import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  loading?: boolean;
  variant?: 'neutral' | 'subtle' | 'danger' | 'success';
  size?: 'sm' | 'md';
}

export function ActionButton({
  children,
  className,
  icon,
  loading,
  disabled,
  variant = 'neutral',
  size = 'md',
  ...props
}: ActionButtonProps) {
  const variantClasses: Record<NonNullable<ActionButtonProps['variant']>, string> = {
    neutral:
      'bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-600 rounded-lg font-medium text-gray-700 shadow-sm',
    subtle:
      'gap-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded',
    danger:
      'bg-white border border-red-300 hover:bg-red-50 rounded text-xs text-red-700',
    success:
      'bg-green-600 text-white hover:bg-green-700 rounded text-xs',
  };

  const sizeClasses: Record<NonNullable<ActionButtonProps['size']>, string> = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon || null}
      {children}
    </button>
  );
}

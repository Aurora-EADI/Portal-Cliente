import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode;
    loading?: boolean;
}

export function ActionButton({
    children,
    className,
    icon,
    loading,
    disabled,
    ...props
}: ActionButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
            disabled={loading || disabled}
            {...props}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : icon ? (
                icon
            ) : null}
            {children}
        </button>
    );
}

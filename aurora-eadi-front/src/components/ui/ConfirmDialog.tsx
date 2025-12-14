'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
    isLoading?: boolean;
}

/**
 * Componente de diálogo de confirmação reutilizável
 * 
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Aprovar Documento"
 *   description="Deseja realmente aprovar este documento?"
 *   confirmText="Aprovar"
 *   variant="default"
 *   onConfirm={handleApprove}
 * />
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'default',
    onConfirm,
    isLoading = false,
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={
                            variant === 'destructive'
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-600'
                        }
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

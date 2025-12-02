"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode; // ícone opcional
  children: ReactNode; // texto do botão
}

export function CustomButton({ icon, children, disabled, ...props }: ActionButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-md px-4 py-2
        text-sm font-medium
        transition-colors duration-200
        shadow-sm
        bg-primary text-primary-foreground
        hover:bg-primary/90

        disabled:bg-gray-400
        disabled:text-gray-200
        disabled:cursor-not-allowed
        disabled:opacity-100
        disabled:hover:bg-gray-400
      `}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  );
}

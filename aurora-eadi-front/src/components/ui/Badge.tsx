import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { DocumentStatus, CompanyStatus } from "@/types"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 shadow",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 shadow",
        danger:
          "border-transparent bg-red-100 text-red-800 shadow",
        pending_active:
          "border-transparent text-center bg-blue-100 text-secondary-foreground shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  status?: DocumentStatus | CompanyStatus;
  context?: "document" | "company";
}

function Badge({ className, variant, status, context, children, ...props }: BadgeProps) {
  // Se status e context forem fornecidos, determina a variant e o texto automaticamente
  if (status && context) {
    let autoVariant: VariantProps<typeof badgeVariants>["variant"] = "default";
    let text = "";

    if (context === "document") {
      switch (status) {
        case DocumentStatus.PENDING:
          autoVariant = "warning";
          text = "Pendente";
          break;
        case DocumentStatus.APPROVED:
          autoVariant = "success";
          text = "Aprovado";
          break;
        case DocumentStatus.REJECTED:
          autoVariant = "danger";
          text = "Reprovado";
          break;
      }
    } else if (context === "company") {
      switch (status) {
        case CompanyStatus.PENDING:
          autoVariant = "warning";
          text = "Pendente";
          break;
        case CompanyStatus.PENDING_ACTIVE:
          autoVariant = "pending_active";
          text = "Em Aprovação";
          break;  
        case CompanyStatus.ACTIVE:
          autoVariant = "success";
          text = "Ativo";
          break;
        case CompanyStatus.REJECTED:
          autoVariant = "danger";
          text = "Bloqueado";
          break;
      }
    }

    return (
      <div className={cn(badgeVariants({ variant: autoVariant }), className)} {...props}>
        {text}
      </div>
    );
  }

  // Uso padrão sem status/context
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

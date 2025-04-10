import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/classNames"

const badgeVariants = cva(
  "jd-inline-flex jd-items-center jd-rounded-full jd-border jd-px-2.5 jd-py-0.5 jd-text-xs jd-font-semibold jd-transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "jd-border-transparent jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/80",
        secondary:
          "jd-border-transparent jd-bg-secondary jd-text-secondary-foreground hover:jd-bg-secondary/80",
        destructive:
          "jd-border-transparent jd-bg-destructive jd-text-destructive-foreground hover:jd-bg-destructive/80",
        outline: "jd-text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

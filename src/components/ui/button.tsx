import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/classNames"

const buttonVariants = cva(
  "jd-inline-flex jd-items-center jd-justify-center jd-whitespace-nowrap jd-rounded-md jd-text-sm jd-font-medium jd-ring-offset-background jd-transition-colors jd-focus-visible:outline-none jd-focus-visible:ring-2 jd-focus-visible:ring-ring jd-focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90",
        destructive:
          "jd-bg-destructive jd-text-destructive-foreground hover:jd-bg-destructive/90",
        outline:
          "jd-border jd-border-input jd-bg-background hover:jd-bg-accent hover:jd-text-accent-foreground",
        secondary:
          "jd-bg-secondary jd-text-secondary-foreground hover:jd-bg-secondary/80",
        ghost: "hover:jd-bg-accent hover:jd-text-accent-foreground",
        link: "jd-text-primary jd-underline-offset-4 hover:jd-underline",
      },
      size: {
        default: "jd-h-10 jd-px-4 jd-py-2",
        sm: "jd-h-9 jd-rounded-md jd-px-3",
        lg: "jd-h-11 jd-rounded-md jd-px-8",
        icon: "jd-h-10 jd-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
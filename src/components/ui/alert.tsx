import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/classNames"

const alertVariants = cva(
  "jd-relative jd-w-full jd-rounded-lg jd-border jd-p-4 [&>svg~*]:jd-pl-7 [&>svg+div]:jd-translate-y-[-3px] [&>svg]:jd-absolute [&>svg]:jd-left-4 [&>svg]:jd-top-4 [&>svg]:jd-text-foreground",
  {
    variants: {
      variant: {
        default: "jd-bg-background jd-text-foreground",
        destructive:
          "jd-border-destructive/50 jd-border-destructive [&>svg]:jd-text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("jd-mb-1 jd-font-medium jd-leading-none jd-tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("jd-text-sm [&_p]:jd-leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

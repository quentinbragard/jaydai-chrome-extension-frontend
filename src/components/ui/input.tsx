import * as React from "react"

import { cn } from "@/core/utils/classNames"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "jd-flex jd-h-9 jd-w-full jd-rounded-md jd-border jd-border-input jd-bg-transparent jd-px-3 jd-py-1 jd-text-base jd-shadow-sm jd-transition-colors file:jd-border-0 file:jd-bg-transparent file:jd-text-sm file:jd-font-medium file:jd-text-foreground placeholder:jd-text-muted-foreground jd-focus-visible:outline-none jd-focus-visible:ring-1 jd-focus-visible:ring-ring jd-disabled:cursor-not-allowed jd-disabled:opacity-50 md:jd-text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

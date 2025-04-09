import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/core/utils/classNames"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "jd-relative jd-h-2 jd-w-full jd-overflow-hidden jd-rounded-full jd-bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="jd-h-full jd-w-full jd-flex-1 jd-bg-primary jd-transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

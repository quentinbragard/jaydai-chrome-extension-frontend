import * as React from "react"

import { cn } from "@/core/utils/classNames"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "jd-flex jd-min-h-[80px] jd-w-full jd-rounded-md jd-border jd-border-input jd-bg-background jd-px-3 jd-py-2 jd-text-base jd-ring-offset-background placeholder:jd-text-muted-foreground jd-focus-visible:outline-none jd-focus-visible:ring-2 jd-focus-visible:ring-ring jd-focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:jd-text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

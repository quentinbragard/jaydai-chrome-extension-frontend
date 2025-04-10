"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/core/utils/classNames"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "jd-peer jd-inline-flex jd-h-6 jd-w-11 jd-shrink-0 jd-cursor-pointer jd-items-center jd-rounded-full jd-border-2 jd-border-transparent jd-transition-colors jd-focus-visible:outline-none jd-focus-visible:ring-2 jd-focus-visible:ring-ring jd-focus-visible:ring-offset-2 jd-focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:jd-bg-primary data-[state=unchecked]:jd-bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "jd-pointer-events-none jd-block jd-h-5 jd-w-5 jd-rounded-full jd-bg-background jd-shadow-lg jd-ring-0 jd-transition-transform data-[state=checked]:jd-translate-x-5 data-[state=unchecked]:jd-translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

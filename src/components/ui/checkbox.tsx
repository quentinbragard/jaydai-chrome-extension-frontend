"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from '@/core/utils/classNames';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "jd-peer jd-h-4 jd-w-4 jd-shrink-0 jd-rounded-sm jd-border jd-border-primary jd-shadow focus-visible:jd-outline-none focus-visible:jd-ring-1 focus-visible:jd-ring-ring disabled:jd-cursor-not-allowed disabled:jd-opacity-50 data-[state=checked]:jd-bg-primary data-[state=checked]:jd-text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("jd-flex jd-items-center jd-justify-center jd-text-current")}
    >
      <Check className="jd-h-4 jd-w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/core/utils/classNames"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "jd-z-50 jd-overflow-hidden jd-rounded-md jd-bg-primary jd-px-3 jd-py-1.5 jd-text-xs jd-text-primary-foreground jd-animate-in jd-fade-in-0 jd-zoom-in-95 jd-data-[state=closed]:jd-animate-out jd-data-[state=closed]:jd-fade-out-0 jd-data-[state=closed]:jd-zoom-out-95 jd-data-[side=bottom]:jd-slide-in-from-top-2 jd-data-[side=left]:jd-slide-in-from-right-2 jd-data-[side=right]:jd-slide-in-from-left-2 jd-data-[side=top]:jd-slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

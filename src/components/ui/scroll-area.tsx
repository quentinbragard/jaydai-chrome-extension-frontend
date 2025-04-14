"use client"

import * as React from "react"
import { cn } from "@/core/utils/classNames"

/**
 * A simple native scroll area that works reliably in Shadow DOM
 * Uses the browser's native scrolling behavior instead of trying to create a custom scrollbar
 */
const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    viewportClassName?: string;
    thumbClassName?: string;
  }
>(({ className, children, viewportClassName, thumbClassName, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("jd-relative jd-overflow-hidden", className)}
      {...props}
    >
      <div 
        className={cn(
          "jd-h-full jd-w-full jd-overflow-auto jd-scrollbar-thin jd-scrollbar-thumb-rounded",
          "jd-scrollbar jd-scrollbar-track-transparent", 
          viewportClassName
        )}
        style={{
          // Add some custom scrollbar styling that works in Shadow DOM
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
})
ScrollArea.displayName = "ScrollArea"

/**
 * A simple horizontal scroll area
 */
const ScrollAreaHorizontal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("jd-relative jd-overflow-hidden", className)}
      {...props}
    >
      <div 
        className="jd-h-full jd-w-full jd-overflow-x-auto jd-overflow-y-hidden jd-scrollbar-thin jd-scrollbar-thumb-rounded"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
})
ScrollAreaHorizontal.displayName = "ScrollAreaHorizontal"

export { ScrollArea, ScrollAreaHorizontal }
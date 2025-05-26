"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/core/utils/classNames"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "jd-flex jd-h-full jd-w-full jd-data-[panel-group-direction=vertical]:jd-flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "jd-relative jd-flex jd-w-px jd-items-center jd-justify-center jd-bg-border jd-after:jd-absolute jd-after:jd-inset-y-0 jd-after:jd-left-1/2 jd-after:jd-w-1 jd-after:jd--translate-x-1/2 jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-1 jd-focus-visible:jd-ring-ring jd-focus-visible:jd-ring-offset-1 jd-data-[panel-group-direction=vertical]:jd-h-px jd-data-[panel-group-direction=vertical]:jd-w-full jd-data-[panel-group-direction=vertical]:jd-after:jd-left-0 jd-data-[panel-group-direction=vertical]:jd-after:jd-h-1 jd-data-[panel-group-direction=vertical]:jd-after:jd-w-full jd-data-[panel-group-direction=vertical]:jd-after:jd--translate-y-1/2 jd-data-[panel-group-direction=vertical]:jd-after:jd-translate-x-0 [&[data-panel-group-direction=vertical]>div]:jd-rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="jd-z-10 jd-flex jd-h-4 jd-w-3 jd-items-center jd-justify-center jd-rounded-sm jd-border jd-bg-border">
        <GripVertical className="jd-h-2.5 jd-w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

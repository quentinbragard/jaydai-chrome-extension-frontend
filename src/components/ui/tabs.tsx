"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/core/utils/classNames"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "jd-inline-flex jd-items-center jd-justify-center jd-rounded-md jd-bg-muted jd-p-1 jd-text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "jd-inline-flex jd-items-center jd-justify-center jd-whitespace-nowrap jd-rounded-sm jd-px-3 jd-py-1.5 jd-text-sm jd-font-medium jd-ring-offset-background jd-transition-all focus-visible:jd-outline-none focus-visible:jd-ring-2 focus-visible:jd-ring-ring focus-visible:jd-ring-offset-2 disabled:jd-pointer-events-none disabled:jd-opacity-50 data-[state=active]:jd-bg-background data-[state=active]:jd-text-foreground data-[state=active]:jd-shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "jd-mt-2 jd-ring-offset-background focus-visible:jd-outline-none focus-visible:jd-ring-2 focus-visible:jd-ring-ring focus-visible:jd-ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

import { debug } from '@/core/config';
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/core/utils/classNames"
import { useShadowRoot } from "@/core/utils/componentInjector"
const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

// Custom DialogPortal that uses shadow DOM
const SelectPortal = ({ children, ...props }: SelectPrimitive.SelectPortalProps) => {
  const shadowRoot = useShadowRoot();
  debug('shadowRoot', shadowRoot);
  
  // If we have access to the shadow root, use it as the portal container
  return (
    <SelectPrimitive.Portal 
      {...props} 
      container={shadowRoot || undefined}
    >
      {children}
    </SelectPrimitive.Portal>
  );
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "jd-flex jd-h-9 jd-w-full jd-items-center jd-justify-between jd-whitespace-nowrap jd-rounded-md jd-border jd-border-input jd-bg-transparent jd-px-3 jd-py-2 jd-text-sm jd-shadow-sm jd-ring-offset-background data-[placeholder]:jd-text-muted-foreground focus:jd-outline-none focus:jd-ring-1 focus:jd-ring-ring disabled:jd-cursor-not-allowed disabled:jd-opacity-50 [&>span]:jd-line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="jd-h-4 jd-w-4 jd-opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "jd-flex jd-cursor-default jd-items-center jd-justify-center jd-py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="jd-h-4 jd-w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "jd-flex jd-cursor-default jd-items-center jd-justify-center jd-py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="jd-h-4 jd-w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPortal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "jd-relative jd-z-[10002] jd-max-h-[--radix-select-content-available-height] jd-min-w-[8rem] jd-overflow-y-auto jd-overflow-x-hidden jd-rounded-md jd-border jd-bg-popover jd-text-popover-foreground jd-shadow-md data-[state=open]:jd-animate-in data-[state=closed]:jd-animate-out data-[state=closed]:jd-fade-out-0 data-[state=open]:jd-fade-in-0 data-[state=closed]:jd-zoom-out-95 data-[state=open]:jd-zoom-in-95 data-[side=bottom]:jd-slide-in-from-top-2 data-[side=left]:jd-slide-in-from-right-2 data-[side=right]:jd-slide-in-from-left-2 data-[side=top]:jd-slide-in-from-bottom-2 jd-origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:jd-translate-y-1 data-[side=left]:jd-translate-x-1 data-[side=right]:jd-translate-x-1 data-[side=top]:jd-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "jd-p-1",
          position === "popper" &&
            "jd-h-[var(--radix-select-trigger-height)] jd-w-full jd-min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPortal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("jd-px-2 jd-py-1.5 jd-text-sm jd-font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "jd-relative jd-flex jd-w-full jd-cursor-default jd-select-none jd-items-center jd-rounded-sm jd-py-1.5 jd-pl-2 jd-pr-8 jd-text-sm jd-outline-none focus:jd-bg-accent focus:jd-text-accent-foreground data-[disabled]:jd-pointer-events-none data-[disabled]:jd-opacity-50",
      className
    )}
    {...props}
  >
    <span className="jd-absolute jd-right-2 jd-flex jd-h-4 jd-w-4 jd-items-center jd-justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="jd-h-4 jd-w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("jd-mx-1 jd-my-1 jd-h-px jd-bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

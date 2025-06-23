"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { useShadowRoot } from "@/core/utils/componentInjector"

import { cn } from '@/core/utils/classNames';

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = ({ children, ...props }: DropdownMenuPrimitive.DropdownMenuPortalProps) => {
  const shadowRoot = useShadowRoot();
  return (
    <DropdownMenuPrimitive.Portal {...props} container={shadowRoot || undefined}>
      {children}
    </DropdownMenuPrimitive.Portal>
  );
}

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "jd-flex jd-cursor-default jd-select-none jd-items-center jd-gap-2 jd-rounded-sm jd-px-2 jd-py-1.5 jd-text-sm jd-outline-none focus:jd-bg-accent data-[state=open]:jd-bg-accent [&_svg]:jd-pointer-events-none [&_svg]:jd-size-4 [&_svg]:jd-shrink-0",
      inset && "jd-pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="jd-ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "jd-z-50 jd-min-w-[8rem] jd-overflow-hidden jd-rounded-md jd-border jd-bg-popover jd-p-1 jd-text-popover-foreground jd-shadow-lg data-[state=open]:jd-animate-in data-[state=closed]:jd-animate-out data-[state=closed]:jd-fade-out-0 data-[state=open]:jd-fade-in-0 data-[state=closed]:jd-zoom-out-95 data-[state=open]:jd-zoom-in-95 data-[side=bottom]:jd-slide-in-from-top-2 data-[side=left]:jd-slide-in-from-right-2 data-[side=right]:jd-slide-in-from-left-2 data-[side=top]:jd-slide-in-from-bottom-2 jd-origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "jd-z-[10005] jd-max-h-[var(--radix-dropdown-menu-content-available-height)] jd-min-w-[8rem] jd-overflow-y-auto jd-overflow-x-hidden jd-rounded-md jd-border jd-bg-popover jd-p-1 jd-text-popover-foreground jd-shadow-md data-[state=open]:jd-animate-in data-[state=closed]:jd-animate-out data-[state=closed]:jd-fade-out-0 data-[state=open]:jd-fade-in-0 data-[state=closed]:jd-zoom-out-95 data-[state=open]:jd-zoom-in-95 data-[side=bottom]:jd-slide-in-from-top-2 data-[side=left]:jd-slide-in-from-right-2 data-[side=right]:jd-slide-in-from-left-2 data-[side=top]:jd-slide-in-from-bottom-2 jd-origin-[--radix-dropdown-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </DropdownMenuPortal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "jd-relative jd-flex jd-cursor-default jd-select-none jd-items-center jd-gap-2 jd-rounded-sm jd-px-2 jd-py-1.5 jd-text-sm jd-outline-none jd-transition-colors focus:jd-bg-accent focus:jd-text-accent-foreground data-[disabled]:jd-pointer-events-none data-[disabled]:jd-opacity-50 [&_svg]:jd-pointer-events-none [&_svg]:jd-size-4 [&_svg]:jd-shrink-0",
      inset && "jd-pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "jd-relative jd-flex jd-cursor-default jd-select-none jd-items-center jd-rounded-sm jd-py-1.5 jd-pl-8 jd-pr-2 jd-text-sm jd-outline-none jd-transition-colors focus:jd-bg-accent focus:jd-text-accent-foreground data-[disabled]:jd-pointer-events-none data-[disabled]:jd-opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="jd-absolute jd-left-2 jd-flex jd-h-4 jd-w-4 jd-items-center jd-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="jd-h-4 jd-w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "jd-relative jd-flex jd-cursor-default jd-select-none jd-items-center jd-rounded-sm jd-py-1.5 jd-pl-8 jd-pr-2 jd-text-sm jd-outline-none jd-transition-colors focus:jd-bg-accent focus:jd-text-accent-foreground data-[disabled]:jd-pointer-events-none data-[disabled]:jd-opacity-50",
      className
    )}
    {...props}
  >
    <span className="jd-absolute jd-left-2 jd-flex jd-h-4 jd-w-4 jd-items-center jd-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="jd-h-2 jd-w-2 jd-fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "jd-px-2 jd-py-1.5 jd-text-sm jd-font-semibold",
      inset && "jd-pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("jd--mx-1 jd-my-1 jd-h-px jd-bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("jd-ml-auto jd-text-xs jd-tracking-widest jd-opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}

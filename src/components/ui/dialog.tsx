"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/core/utils/classNames"
import { useShadowRoot } from "@/core/utils/componentInjector"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

// Custom DialogPortal that uses shadow DOM
const DialogPortal = ({ children, ...props }: DialogPrimitive.DialogPortalProps) => {
  const shadowRoot = useShadowRoot();
  
  // If we have access to the shadow root, use it as the portal container
  return (
    <DialogPrimitive.Portal 
      {...props} 
      container={shadowRoot || undefined}
    >
      {children}
    </DialogPrimitive.Portal>
  );
}

const DialogClose = DialogPrimitive.Close
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "jd-fixed jd-inset-0 jd-z-50 jd-bg-black/80  data-[state=open]:jd-animate-in data-[state=closed]:jd-animate-out data-[state=closed]:jd-fade-out-0 data-[state=open]:jd-fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "jd-fixed jd-left-[50%] jd-top-[50%] jd-z-50 jd-grid jd-w-full  jd-translate-x-[-50%] jd-translate-y-[-50%] jd-gap-4 jd-border jd-bg-background jd-p-6 jd-shadow-lg jd-duration-200 data-[state=open]:jd-animate-in data-[state=closed]:jd-animate-out data-[state=closed]:jd-fade-out-0 data-[state=open]:jd-fade-in-0 data-[state=closed]:jd-zoom-out-95 data-[state=open]:jd-zoom-in-95 data-[state=closed]:jd-slide-out-to-left-1/2 data-[state=closed]:jd-slide-out-to-top-[48%] data-[state=open]:jd-slide-in-from-left-1/2 data-[state=open]:jd-slide-in-from-top-[48%] sm:jd-rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="jd-absolute jd-right-4 jd-top-4 jd-rounded-sm jd-opacity-70 jd-ring-offset-background jd-transition-opacity hover:jd-opacity-100 focus:jd-outline-none focus:jd-ring-2 focus:jd-ring-ring focus:jd-ring-offset-2 disabled:jd-pointer-events-none data-[state=open]:jd-bg-accent data-[state=open]:jd-text-muted-foreground">
        <X className="jd-h-4 jd-w-4" />
        <span className="jd-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "jd-flex jd-flex-col-reverse jd-sm:jd-flex-row jd-sm:jd-justify-end jd-sm:jd-space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "jd-text-lg jd-font-semibold jd-leading-none jd-tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("jd-text-sm jd-text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

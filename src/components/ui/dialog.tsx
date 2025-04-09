import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/core/utils/classNames"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "jd-fixed jd-inset-0 jd-z-50 jd-bg-black/80  jd-data-[state=open]:jd-animate-in jd-data-[state=closed]:jd-animate-out jd-data-[state=closed]:jd-fade-out-0 jd-data-[state=open]:jd-fade-in-0",
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
        "jd-fixed jd-left-[50%] jd-top-[50%] jd-z-50 jd-grid jd-w-full jd-max-w-lg jd-translate-x-[-50%] jd-translate-y-[-50%] jd-gap-4 jd-border jd-bg-background jd-p-6 jd-shadow-lg jd-duration-200 jd-data-[state=open]:jd-animate-in jd-data-[state=closed]:jd-animate-out jd-data-[state=closed]:jd-fade-out-0 jd-data-[state=open]:jd-fade-in-0 jd-data-[state=closed]:jd-zoom-out-95 jd-data-[state=open]:jd-zoom-in-95 jd-data-[state=closed]:jd-slide-out-to-left-1/2 jd-data-[state=closed]:jd-slide-out-to-top-[48%] jd-data-[state=open]:jd-slide-in-from-left-1/2 jd-data-[state=open]:jd-slide-in-from-top-[48%] jd-sm:jd-rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="jd-absolute jd-right-4 jd-top-4 jd-rounded-sm jd-opacity-70 jd-ring-offset-background jd-transition-opacity jd-hover:jd-opacity-100 jd-focus:jd-outline-none jd-focus:jd-ring-2 jd-focus:jd-ring-ring jd-focus:jd-ring-offset-2 jd-disabled:jd-pointer-events-none jd-data-[state=open]:jd-bg-accent jd-data-[state=open]:jd-text-muted-foreground">
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
      "jd-flex jd-flex-col jd-space-y-1.5 jd-text-center jd-sm:jd-text-left",
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
    className={cn("text-sm text-muted-foreground", className)}
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

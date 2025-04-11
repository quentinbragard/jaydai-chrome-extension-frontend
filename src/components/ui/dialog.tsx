"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/core/utils/classNames"
import { useShadowRoot } from "@/core/utils/componentInjector"

// Custom hook to detect dark mode
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Check for dark mode using document.documentElement
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Function to check and update dark mode state
    const updateDarkModeState = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Set up observer to detect class changes on documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateDarkModeState();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, { attributes: true });
    
    // Initial check
    updateDarkModeState();
    
    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};

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
>(({ className, ...props }, ref) => {
  const isDarkMode = useDarkMode();
  
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "jd-fixed jd-inset-0 jd-z-50 jd-bg-black/80 data-[state=open]:jd-animate-in data-[state=closed]:jd-animate-out data-[state=closed]:jd-fade-out-0 data-[state=open]:jd-fade-in-0",
        className
      )}
      {...props}
    />
  );
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const isDarkMode = useDarkMode();
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "jd-fixed jd-left-[50%] jd-top-[50%] jd-z-50 jd-grid jd-max-w-7xl jd-translate-x-[-50%] jd-translate-y-[-50%] jd-gap-4 jd-border jd-p-6 jd-shadow-lg jd-duration-200 data-[state=open]:jd-animate-in data-[state=closed]:jd-animate-out data-[state=closed]:jd-fade-out-0 data-[state=open]:jd-fade-in-0 data-[state=closed]:jd-zoom-out-95 data-[state=open]:jd-zoom-in-95 data-[state=closed]:jd-slide-out-to-left-1/2 data-[state=closed]:jd-slide-out-to-top-[48%] data-[state=open]:jd-slide-in-from-left-1/2 data-[state=open]:jd-slide-in-from-top-[48%] sm:jd-rounded-lg",
          // Apply light/dark mode styling directly
          isDarkMode 
            ? "jd-bg-gray-900 jd-text-gray-50 jd-border-gray-800" 
            : "jd-bg-white jd-text-gray-950 jd-border-gray-200",
          className
        )}
        {...props}
      >
        {/* Use a wrapper div with dark class when in dark mode */}
        <div className={isDarkMode ? "dark" : ""} style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
        <DialogPrimitive.Close className={cn(
          "jd-absolute jd-right-4 jd-top-4 jd-rounded-sm jd-opacity-70 jd-transition-opacity hover:jd-opacity-100 focus:jd-outline-none focus:jd-ring-2 focus:jd-ring-offset-2 disabled:jd-pointer-events-none",
          isDarkMode 
            ? "jd-text-gray-400 hover:jd-text-gray-100 focus:jd-ring-gray-400 focus:jd-ring-offset-gray-900" 
            : "jd-text-gray-500 hover:jd-text-gray-900 focus:jd-ring-gray-500 focus:jd-ring-offset-white"
        )}>
          <X className="jd-h-4 jd-w-4" />
          <span className="jd-sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "jd-flex jd-flex-col jd-space-y-1.5 jd-text-center sm:jd-text-left",
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
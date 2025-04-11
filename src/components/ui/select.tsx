"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
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

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const isDarkMode = useDarkMode();
  
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "jd-flex jd-h-10 jd-w-full jd-items-center jd-justify-between jd-rounded-md jd-border jd-px-3 jd-py-2 jd-text-sm jd-focus:outline-none jd-focus:ring-2 jd-focus:ring-offset-2 jd-disabled:cursor-not-allowed jd-disabled:opacity-50 [&>span]:jd-line-clamp-1",
        isDarkMode 
          ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700 jd-focus:ring-gray-500 jd-focus:ring-offset-gray-900 jd-data-[placeholder]:jd-text-gray-400" 
          : "jd-bg-white jd-text-gray-900 jd-border-gray-200 jd-focus:ring-gray-400 jd-focus:ring-offset-white jd-data-[placeholder]:jd-text-gray-500",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="jd-h-4 jd-w-4 jd-opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
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
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const shadowRoot = useShadowRoot();
  const isDarkMode = useDarkMode();
  
  return (
    <SelectPrimitive.Portal container={shadowRoot || undefined}>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "jd-relative jd-z-50 jd-max-h-[--radix-select-content-available-height] jd-min-w-[8rem] jd-overflow-y-auto jd-overflow-x-hidden jd-rounded-md jd-border jd-shadow-md",
          "jd-data-[state=open]:jd-animate-in jd-data-[state=closed]:jd-animate-out jd-data-[state=closed]:jd-fade-out-0 jd-data-[state=open]:jd-fade-in-0 jd-data-[state=closed]:jd-zoom-out-95 jd-data-[state=open]:jd-zoom-in-95",
          "jd-data-[side=bottom]:jd-slide-in-from-top-2 jd-data-[side=left]:jd-slide-in-from-right-2 jd-data-[side=right]:jd-slide-in-from-left-2 jd-data-[side=top]:jd-slide-in-from-bottom-2 jd-origin-[--radix-select-content-transform-origin]",
          isDarkMode 
            ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700" 
            : "jd-bg-white jd-text-gray-900 jd-border-gray-200",
          position === "popper" &&
            "jd-data-[side=bottom]:jd-translate-y-1 jd-data-[side=left]:jd--translate-x-1 jd-data-[side=right]:jd-translate-x-1 jd-data-[side=top]:jd--translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <div className={isDarkMode ? "dark" : ""}>
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
        </div>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => {
  const isDarkMode = useDarkMode();
  
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        "jd-py-1.5 jd-pl-8 jd-pr-2 jd-text-sm jd-font-semibold",
        isDarkMode ? "jd-text-gray-300" : "jd-text-gray-700",
        className
      )}
      {...props}
    />
  )
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const isDarkMode = useDarkMode();
  
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "jd-relative jd-flex jd-w-full jd-cursor-default jd-select-none jd-items-center jd-rounded-sm jd-py-1.5 jd-pl-8 jd-pr-2 jd-text-sm jd-outline-none jd-data-[disabled]:jd-pointer-events-none jd-data-[disabled]:jd-opacity-50",
        isDarkMode 
          ? "jd-text-gray-200 jd-focus:jd-bg-gray-700 jd-focus:jd-text-gray-100" 
          : "jd-text-gray-800 jd-focus:jd-bg-gray-100 jd-focus:jd-text-gray-900",
        className
      )}
      {...props}
    >
      <span className="jd-absolute jd-left-2 jd-flex jd-h-3.5 jd-w-3.5 jd-items-center jd-justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className={cn(
            "jd-h-4 jd-w-4",
            isDarkMode ? "jd-text-blue-400" : "jd-text-blue-600"
          )} />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const isDarkMode = useDarkMode();
  
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn(
        "jd--mx-1 jd-my-1 jd-h-px",
        isDarkMode ? "jd-bg-gray-700" : "jd-bg-gray-200",
        className
      )}
      {...props}
    />
  )
})
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
import * as React from "react"
import { cn } from "@/core/utils/classNames"

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

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const isDarkMode = useDarkMode();
    
    return (
      <input
        type={type}
        className={cn(
          "jd-flex jd-h-9 jd-w-full jd-rounded-md jd-border jd-px-3 jd-py-1 jd-text-black jd-shadow-sm jd-transition-colors",
          "file:jd-border-0 file:jd-bg-transparent file:jd-text-sm file:jd-font-medium",
          "jd-focus-visible:outline-none jd-focus-visible:ring-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:jd-text-sm",
          // Dark mode specific styles
          isDarkMode ? [
            "jd-border-gray-700",
            "jd-bg-gray-800/30",
            "jd-text-gray-100",
            "placeholder:jd-text-gray-400",
            "file:jd-text-gray-200",
            "jd-focus-visible:ring-gray-500",
            "hover:jd-border-gray-600"
          ] : [
            "jd-border-gray-200",
            "jd-bg-white/90",
            "jd-text-gray-900",
            "placeholder:jd-text-gray-500",
            "file:jd-text-gray-700",
            "jd-focus-visible:ring-blue-500",
            "hover:jd-border-gray-300"
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
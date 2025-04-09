import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="jd-toaster jd-group"
      toastOptions={{
        classNames: {
          toast:
            "jd-group jd-toast jd-group-[.toaster]:jd-bg-background jd-group-[.toaster]:jd-text-foreground jd-group-[.toaster]:jd-border-border jd-group-[.toaster]:jd-shadow-lg",
          description: "jd-group-[.toast]:jd-text-muted-foreground",
          actionButton:
            "jd-group-[.toast]:jd-bg-primary jd-group-[.toast]:jd-text-primary-foreground",
          cancelButton:
            "jd-group-[.toast]:jd-bg-muted jd-group-[.toast]:jd-text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

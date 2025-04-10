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
            "jd-group jd-toast group-[.toaster]:jd-bg-background group-[.toaster]:jd-text-foreground group-[.toaster]:jd-border-border group-[.toaster]:jd-shadow-lg",
          description: "group-[.toast]:jd-text-muted-foreground",
          actionButton:
            "group-[.toast]:jd-bg-primary group-[.toast]:jd-text-primary-foreground",
          cancelButton:
            "group-[.toast]:jd-bg-muted group-[.toast]:jd-text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

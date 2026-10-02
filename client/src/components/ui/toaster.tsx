import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastProvider,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, variant, duration, ...props }) {
        return (
          <Toast
            key={id}
            variant={variant}
            {...props}
            duration={duration ?? (variant === "destructive" ? 6000 : 2000)}
          >
            <div className="grid min-w-0 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

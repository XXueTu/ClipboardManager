import { X } from "lucide-react"
import * as React from "react"
import { cn } from "../../lib/utils"

const ToastContext = React.createContext({})

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([])

  const addToast = React.useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, toast.duration || 3000)
    }
    
    return id
  }, [])

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback((props) => addToast(props), [addToast])

  toast.success = React.useCallback((title, description) => 
    addToast({ title, description, variant: "default" }), [addToast])
  toast.error = React.useCallback((title, description) => 
    addToast({ title, description, variant: "destructive" }), [addToast])
  toast.warning = React.useCallback((title, description) => 
    addToast({ title, description, variant: "warning" }), [addToast])

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] flex max-h-screen w-full flex-col-reverse sm:bottom-4 sm:left-4 sm:top-auto sm:flex-col md:max-w-[320px]">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const Toast = ({ id, title, description, variant = "default", onClose }) => {
  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border p-3 pr-6 shadow-md transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        variant === "default" && "border bg-background text-foreground",
        variant === "destructive" && "destructive border-destructive bg-destructive text-destructive-foreground",
        variant === "warning" && "border-yellow-200 bg-yellow-50 text-yellow-800"
      )}
    >
      <div className="grid gap-0.5">
        {title && <div className="text-xs font-medium">{title}</div>}
        {description && <div className="text-xs opacity-80">{description}</div>}
      </div>
      <button
        className="absolute right-1 top-1 rounded-md p-0.5 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100"
        onClick={onClose}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export { Toast, ToastProvider, useToast }

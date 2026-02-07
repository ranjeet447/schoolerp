import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../lib/utils" // I'll assume cn exists or use a simple concat

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          variant === "default" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
        } ${size === "lg" ? "h-11 px-8 rounded-md" : (size === "sm" ? "h-9 px-3" : (size === "icon" ? "h-10 w-10" : "h-10 px-4 py-2"))} ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

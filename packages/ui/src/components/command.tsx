"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "../lib/utils"

// Simple stub for Command component since cmdk is missing
// In a real app, this would use 'cmdk'

const Command = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-gray-900", className)}>
    {children}
  </div>
)

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center border-b px-3" cmk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
)
CommandInput.displayName = "CommandInput"

const CommandList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}>
    {children}
  </div>
)

const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
  <div className="py-6 text-center text-sm">{children}</div>
)

const CommandGroup = ({ children, heading, className }: { children: React.ReactNode, heading?: string, className?: string }) => (
  <div className={cn("p-1", className)}>
    {heading && <div className="px-2 py-1.5 text-xs font-medium text-gray-500">{heading}</div>}
    {children}
  </div>
)

const CommandItem = React.forwardRef<HTMLDivElement, { onSelect?: (val: string) => void, value: string, children: React.ReactNode, className?: string }>(
  ({ className, onSelect, value, children, ...props }, ref) => (
    <div
      ref={ref}
      onClick={() => onSelect?.(value)}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
CommandItem.displayName = "CommandItem"

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
}

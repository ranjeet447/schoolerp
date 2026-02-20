import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/lib/use-debounced-value"
// Import directly from UI package or ensure local re-exports exist. 
// Given the pattern, we should use @schoolerp/ui for consistency if local files are just re-exports.
import { 
  Button, 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  Popover, 
  PopoverContent, 
  PopoverTrigger,
  Badge
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

export interface TenantSelectProps {
  value?: string | string[]
  onSelect: (value: string | string[]) => void
  placeholder?: string
  className?: string
  includeInactive?: boolean
  multiple?: boolean
}

export function TenantSelect({
  value,
  onSelect,
  placeholder = "Select tenant...",
  className,
  includeInactive = false,
  multiple = false,
}: TenantSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants", debouncedSearch, includeInactive],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        limit: "10",
        include_inactive: includeInactive ? "true" : "false",
      })
      const res = await apiClient(`/admin/platform/tenants?${params.toString()}`)
      if (!res.ok) return []
      return await res.json()
    },
    enabled: open, 
  })

  const handleSelect = (currentValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
      const newValues = currentValues.includes(currentValue)
        ? currentValues.filter((v) => v !== currentValue)
        : [...currentValues, currentValue]
      onSelect(newValues)
    } else {
      onSelect(currentValue === value ? "" : currentValue)
      setOpen(false)
    }
  }

  const selectedTenants = Array.isArray(tenants) ? tenants.filter((t: any) => 
    multiple 
      ? Array.isArray(value) && value.includes(t.id)
      : value === t.id
  ) : []

  // If value is set but not in loaded list (e.g. initial load), we might want to fetch it specifically or handle display.
  // For now, simple fallback.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-[40px]", className)}
        >
          {multiple && Array.isArray(value) && value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.length > 2 ? (
                <Badge variant="secondary" className="mr-1">
                  {value.length} selected
                </Badge>
              ) : (
                value.map((id) => (
                  <Badge variant="secondary" key={id} className="mr-1 mb-1">
                    {tenants.find((t: any) => t.id === id)?.name || id}
                  </Badge>
                ))
              )}
            </div>
          ) : (
             !multiple && value ? (tenants.find((t: any) => t.id === value)?.name || value) : <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command> 
          <CommandInput 
            placeholder="Search tenants..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
          <CommandList>
            <CommandEmpty>No tenant found.</CommandEmpty>
            <CommandGroup>
              {!isLoading && Array.isArray(tenants) && tenants.map((tenant: any) => {
                 const isSelected = multiple 
                    ? Array.isArray(value) && value.includes(tenant.id)
                    : value === tenant.id
                 return (
                <CommandItem
                  key={tenant.id}
                  value={tenant.id}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">{tenant.subdomain}</span>
                  </div>
                </CommandItem>
              )})}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

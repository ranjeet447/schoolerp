import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
// Import directly from UI package
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
  PopoverTrigger 
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { useDebouncedValue } from "@/lib/use-debounced-value"

interface UserSelectProps {
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  className?: string
  roleCode?: string
  tenantId?: string
}

export function UserSelect({
  value,
  onSelect,
  placeholder = "Select user...",
  className,
  roleCode,
  tenantId,
}: UserSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["global-users", debouncedSearch, roleCode, tenantId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append("search", debouncedSearch)
      if (roleCode) params.append("role_code", roleCode)
      if (tenantId) params.append("tenant_id", tenantId)
      params.append("limit", "10")

      const res = await apiClient(`/admin/platform/users?${params.toString()}`)
      if (!res.ok) return []
      return await res.json()
    },
    enabled: open, 
  })

  // Finding display label for selected value
  const selectedUser = Array.isArray(users) ? users.find((u: any) => u.id === value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
           {selectedUser ? selectedUser.full_name : (value ? (users.length > 0 ? value : "Loading...") : <span className="text-muted-foreground">{placeholder}</span>)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search users..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {!isLoading && Array.isArray(users) && users.map((user: any) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{user.full_name}</span>
                    <span className="text-xs text-muted-foreground">{user.email} {user.tenant_name ? `(${user.tenant_name})` : ''}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

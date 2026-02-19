"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@schoolerp/ui";
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
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";

interface Plan {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface PlanSelectProps {
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  includeInactive?: boolean;
}

export function PlanSelect({
  value,
  onSelect,
  placeholder = "Select plan...",
  className,
  includeInactive = false,
}: PlanSelectProps) {
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await apiClient(`/admin/platform/plans?include_inactive=${includeInactive}`);
        if (res.ok) {
          const data = await res.json();
          setPlans(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [includeInactive]);

  const selectedPlan = plans.find((p) => p.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedPlan ? (
             <span className="flex items-center gap-2 truncate">
                <span>{selectedPlan.name}</span>
                <span className="text-muted-foreground text-xs hidden sm:inline-block">({selectedPlan.code})</span>
             </span>
          ) : (
             <span className="text-muted-foreground">{loading ? "Loading..." : placeholder}</span>
          )}
          {loading ? (
             <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search plans..." />
          <CommandList>
             <CommandEmpty>No plan found.</CommandEmpty>
             <CommandGroup>
                {plans.map((plan) => (
                  <CommandItem
                    key={plan.id}
                    value={plan.code} // Search by code too? Command usually searches by text content
                    onSelect={(currentValue) => {
                       // CommandItem value is sometimes lowercased by default implementation, 
                       // but we want the actual code. 
                       // However, since we passed `value={plan.code}`, `currentValue` might be that.
                       // Let's use the plan.code directly.
                      onSelect(plan.code === value ? "" : plan.code);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === plan.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                        <span>{plan.name}</span>
                        <span className="text-xs text-muted-foreground">{plan.code}</span>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

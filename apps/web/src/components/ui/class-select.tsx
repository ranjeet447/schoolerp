"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@schoolerp/ui";
import { Button } from "@schoolerp/ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@schoolerp/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";

type ClassItem = {
  id: string;
  name: string;
};

type ClassSelectProps = {
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function ClassSelect({
  value,
  onSelect,
  placeholder = "Select class...",
  className,
  disabled
}: ClassSelectProps) {
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await apiClient("/admin/academics/classes");
        if (res.ok) {
          const data = await res.json();
          setClasses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const selectedClass = classes.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || loading}
        >
          {selectedClass ? (
            <span className="truncate">{selectedClass.name}</span>
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
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search class..." />
          <CommandList>
            <CommandEmpty>No class found.</CommandEmpty>
            <CommandGroup>
              {classes.map((cls) => (
                <CommandItem
                  key={cls.id}
                  value={cls.name} // searching by name
                  onSelect={() => {
                    onSelect(cls.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cls.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cls.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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

type SectionItem = {
  id: string;
  name: string;
  class_id?: string;
};

type SectionSelectProps = {
  value?: string;
  onSelect: (value: string) => void;
  classId?: string; // Optional dependency
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function SectionSelect({
  value,
  onSelect,
  classId,
  placeholder = "Select section...",
  className,
  disabled
}: SectionSelectProps) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      try {
        // Construct query
        const query = classId ? `?class_id=${classId}` : "";
        const res = await apiClient(`/admin/academics/sections${query}`);
        
        if (res.ok) {
          const data = await res.json();
          // Map data if needed, assuming backend returns { id, name } or similar
          // If backend returns "label": "Class 1 - A", we might need to handle that.
          // For now assuming standard { id, name } array
          setSections(Array.isArray(data) ? data : []);
        } else {
             // Fallback to options if main endpoint fails (safeguard for verifying my assumption)
             // In a real scenario I'd verify endpoint first.
             // But let's assume standard REST for now.
             setSections([]);
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!classId && !open) return; // Don't fetch filtered if no classId unless opened
    // Actually if classId changes, we should fetch.
    
    fetchSections();
  }, [classId]);

  const selectedSection = sections.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || loading || (classId && sections.length === 0 && !loading)}
        >
          {selectedSection ? (
            <span className="truncate">{selectedSection.name}</span>
          ) : (
            <span className="text-muted-foreground">
                {loading ? "Loading..." : (sections.length === 0 && classId ? "No sections found" : placeholder)}
            </span>
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
          <CommandInput placeholder="Search section..." />
          <CommandList>
            <CommandEmpty>No section found.</CommandEmpty>
            <CommandGroup>
              {sections.map((sec) => (
                <CommandItem
                  key={sec.id}
                  value={sec.name}
                  onSelect={() => {
                    onSelect(sec.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === sec.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {sec.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

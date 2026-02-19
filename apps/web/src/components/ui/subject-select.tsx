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

type SubjectItem = {
  id: string;
  name: string;
  code?: string;
};

type SubjectSelectProps = {
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function SubjectSelect({
  value,
  onSelect,
  placeholder = "Select subject...",
  className,
  disabled
}: SubjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await apiClient("/admin/academic-structure/subjects");
        if (res.ok) {
          const data = await res.json();
          setSubjects(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const selectedSubject = subjects.find((s) => s.id === value);

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
          {selectedSubject ? (
            <span className="truncate">
                {selectedSubject.name}
                {selectedSubject.code && <span className="text-muted-foreground ml-1">({selectedSubject.code})</span>}
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
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search subject..." />
          <CommandList>
            <CommandEmpty>No subject found.</CommandEmpty>
            <CommandGroup>
              {subjects.map((subject) => (
                <CommandItem
                  key={subject.id}
                  value={subject.name}
                  onSelect={() => {
                    onSelect(subject.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === subject.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {subject.name}
                  {subject.code && <span className="text-muted-foreground ml-2 text-xs">{subject.code}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

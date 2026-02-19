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

type TeacherItem = {
  id: string;
  full_name: string;
  employee_code?: string;
  department: string;
};

type TeacherSelectProps = {
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function TeacherSelect({
  value,
  onSelect,
  placeholder = "Select teacher...",
  className,
  disabled
}: TeacherSelectProps) {
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const res = await apiClient("/hrms/employees?limit=100");
        if (res.ok) {
          const data: TeacherItem[] = await res.json();
          // Filter client side as verified in ClassTeachersPage
          const teachingStaff = data.filter(e => e.department === "Teaching");
          setTeachers(teachingStaff);
        }
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const selectedTeacher = teachers.find((t) => t.id === value);

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
          {selectedTeacher ? (
             <span className="truncate">
                {selectedTeacher.full_name} 
                {selectedTeacher.employee_code && <span className="text-muted-foreground ml-1">({selectedTeacher.employee_code})</span>}
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
          <CommandInput placeholder="Search teacher..." />
          <CommandList>
            <CommandEmpty>No teacher found.</CommandEmpty>
            <CommandGroup>
              {teachers.map((teacher) => (
                <CommandItem
                  key={teacher.id}
                  value={teacher.full_name}
                  onSelect={() => {
                    onSelect(teacher.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === teacher.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                      <span>{teacher.full_name}</span>
                      <span className="text-xs text-muted-foreground">{teacher.employee_code}</span>
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

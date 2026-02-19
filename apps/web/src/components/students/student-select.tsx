"use client";

import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Input
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { Search } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class_name?: string;
  section_name?: string;
}

interface StudentSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function StudentSelect({ value, onValueChange, placeholder = "Select student..." }: StudentSelectProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        // We'll use a search query if supported, or filter on client
        // For now, let's fetch a limited list
        const res = await apiClient(`/admin/sis/students?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setStudents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter students by name or adm #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-2 text-center text-sm text-muted-foreground">No students found</div>
          ) : (
            filteredStudents.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.full_name} ({student.admission_number})
                {student.class_name && <span className="ml-2 text-xs text-muted-foreground">{student.class_name}</span>}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

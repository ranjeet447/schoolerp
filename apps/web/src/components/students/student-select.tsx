"use client";

import { useState, useEffect } from "react";
import { 
  Button,
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
  baseUrl?: string;
}

export function StudentSelect({ value, onValueChange, placeholder = "Search student by name or admission no...", baseUrl = "/admin" }: StudentSelectProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Debounced search logic
  useEffect(() => {
    if (search.length > 1) {
      const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          const res = await apiClient(`${baseUrl}/students?q=${encodeURIComponent(search)}&limit=10`);
          if (res.ok) {
            const data = await res.json();
            setStudents(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("Failed to fetch students", error);
        } finally {
          setIsLoading(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
    }
  }, [search]);

  // Handle selection
  const handleSelect = (student: Student) => {
    setSelectedStudent(student);
    onValueChange(student.id);
    setSearch("");
    setStudents([]);
  };

  return (
    <div className="space-y-2">
      {selectedStudent ? (
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <div>
            <div className="font-bold text-sm">{selectedStudent.full_name}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {selectedStudent.admission_number} {selectedStudent.class_name && `• ${selectedStudent.class_name}`}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs font-bold hover:bg-primary/10"
            onClick={() => {
              setSelectedStudent(null);
              onValueChange("");
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 border-border/50 rounded-xl bg-background focus:ring-1 focus:ring-primary/40"
            />
          </div>
          
          {search.length > 1 && (students.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-2xl shadow-xl z-50 overflow-hidden">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground italic flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Searching roster...
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex justify-between items-center group"
                      onClick={() => handleSelect(student)}
                    >
                      <div>
                        <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {student.full_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {student.admission_number} {student.class_name && `• ${student.class_name}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

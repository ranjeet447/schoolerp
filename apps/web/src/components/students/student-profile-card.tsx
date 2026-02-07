"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@schoolerp/ui"
import { Badge } from "@schoolerp/ui"
import { User, Calendar, Hash, MapPin, GraduationCap } from "lucide-react"

interface StudentProfileCardProps {
  student: {
    id: string
    admission_number: string
    full_name: string
    date_of_birth?: string
    gender?: string
    class_name?: string
    section_name?: string
    status: string
    address?: string
  }
}

export function StudentProfileCard({ student }: StudentProfileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{student.full_name}</CardTitle>
        <Badge variant={student.status === "active" ? "default" : "secondary"}>
          {student.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Admission No:</span>
            <span className="text-sm">{student.admission_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Class:</span>
            <span className="text-sm">{student.class_name || "N/A"} - {student.section_name || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">DOB:</span>
            <span className="text-sm">{student.date_of_birth || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Gender:</span>
            <span className="text-sm">{student.gender || "N/A"}</span>
          </div>
          <div className="flex items-start gap-2 md:col-span-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            <span className="text-sm font-medium">Address:</span>
            <span className="text-sm">{student.address || "N/A"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { CalendarDays, Loader2, RefreshCw, Trash2 } from "lucide-react"

interface ClassRow {
  id: unknown
  name: string
}

interface SectionRow {
  id: unknown
  name: string
}

interface SubjectRow {
  id: unknown
  name: string
}

interface UserRoleRow {
  id: unknown
  full_name: string
  role_code: string
}

interface TimetableEntry {
  id: string
  class_id: string
  section_id: string
  weekday: string
  start_time: string
  end_time: string
  subject_id: string
  teacher_id: string
  room: string
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const bytesToUuid = (bytes: number[]) => {
  if (bytes.length !== 16) return ""
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const bytes = (value as { Bytes?: unknown }).Bytes
    if (typeof bytes === "string") return bytes
    if (Array.isArray(bytes) && bytes.every((item) => typeof item === "number")) {
      return bytesToUuid(bytes as number[])
    }
  }
  return ""
}

const entryKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function TimetablePage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sections, setSections] = useState<SectionRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [teachers, setTeachers] = useState<UserRoleRow[]>([])
  const [entries, setEntries] = useState<TimetableEntry[]>([])

  const [selectedClassID, setSelectedClassID] = useState("")
  const [form, setForm] = useState<TimetableEntry>({
    id: "",
    class_id: "",
    section_id: "",
    weekday: "monday",
    start_time: "08:00",
    end_time: "08:45",
    subject_id: "",
    teacher_id: "",
    room: "",
  })

  const classMap = useMemo(() => {
    const m = new Map<string, string>()
    classes.forEach((item) => {
      const id = uuidValue(item.id)
      if (id) m.set(id, item.name)
    })
    return m
  }, [classes])

  const sectionMap = useMemo(() => {
    const m = new Map<string, string>()
    sections.forEach((item) => {
      const id = uuidValue(item.id)
      if (id) m.set(id, item.name)
    })
    return m
  }, [sections])

  const subjectMap = useMemo(() => {
    const m = new Map<string, string>()
    subjects.forEach((item) => {
      const id = uuidValue(item.id)
      if (id) m.set(id, item.name)
    })
    return m
  }, [subjects])

  const teacherMap = useMemo(() => {
    const m = new Map<string, string>()
    teachers.forEach((item) => {
      const id = uuidValue(item.id)
      if (id) m.set(id, item.full_name)
    })
    return m
  }, [teachers])

  const loadSections = async (classID: string) => {
    if (!classID) {
      setSections([])
      return
    }
    const res = await apiClient(`/admin/academic-structure/classes/${classID}/sections`)
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || "Failed to load sections")
    }
    const payload = await res.json()
    setSections(Array.isArray(payload) ? payload : [])
  }

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const [timetableRes, classesRes, subjectsRes, usersRes] = await Promise.all([
        apiClient("/admin/timetable"),
        apiClient("/admin/academic-structure/classes"),
        apiClient("/admin/academic-structure/subjects"),
        apiClient("/admin/roles/users"),
      ])

      if (!timetableRes.ok) throw new Error((await timetableRes.text()) || "Failed to load timetable")
      if (!classesRes.ok) throw new Error((await classesRes.text()) || "Failed to load classes")
      if (!subjectsRes.ok) throw new Error((await subjectsRes.text()) || "Failed to load subjects")
      if (!usersRes.ok) throw new Error((await usersRes.text()) || "Failed to load users")

      const timetableData = await timetableRes.json()
      const classesData = await classesRes.json()
      const subjectsData = await subjectsRes.json()
      const usersData = await usersRes.json()

      const loadedClasses = Array.isArray(classesData) ? classesData : []
      const loadedSubjects = Array.isArray(subjectsData) ? subjectsData : []
      const loadedUsers = Array.isArray(usersData) ? usersData : []

      setClasses(loadedClasses)
      setSubjects(loadedSubjects)
      setTeachers(loadedUsers.filter((user: UserRoleRow) => textValue(user.role_code).toLowerCase() === "teacher"))

      const timetableEntries = Array.isArray(timetableData?.entries) ? timetableData.entries : []
      setEntries(timetableEntries)

      const firstClassID = loadedClasses.length > 0 ? uuidValue(loadedClasses[0].id) : ""
      const activeClassID = selectedClassID || firstClassID
      setSelectedClassID(activeClassID)
      if (activeClassID) {
        await loadSections(activeClassID)
      } else {
        setSections([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load timetable"
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addEntry = () => {
    if (!form.class_id || !form.section_id || !form.subject_id || !form.teacher_id) {
      setError("Class, section, subject, and teacher are required")
      return
    }
    if (!form.start_time || !form.end_time || form.start_time >= form.end_time) {
      setError("Provide valid start and end time")
      return
    }

    const next: TimetableEntry = {
      ...form,
      id: entryKey(),
      weekday: form.weekday.toLowerCase(),
      room: form.room.trim(),
    }

    setEntries((prev) => [...prev, next])
    setForm((prev) => ({ ...prev, section_id: "", subject_id: "", teacher_id: "", room: "" }))
    setError("")
  }

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const saveTimetable = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await apiClient("/admin/timetable", {
        method: "PUT",
        body: JSON.stringify({ entries }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to save timetable")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save timetable"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const visibleEntries = useMemo(
    () => entries.filter((entry) => !selectedClassID || entry.class_id === selectedClassID),
    [entries, selectedClassID]
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Manage class schedules and persist them at tenant level.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={saveTimetable} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Timetable
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Schedule Entry</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select
              value={form.class_id}
              onValueChange={async (value) => {
                setForm((prev) => ({ ...prev, class_id: value, section_id: "" }))
                setSelectedClassID(value)
                try {
                  await loadSections(value)
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Failed to load sections"
                  setError(message)
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => {
                  const id = uuidValue(c.id)
                  return (
                    <SelectItem key={id} value={id}>{c.name}</SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={form.section_id} onValueChange={(value) => setForm((prev) => ({ ...prev, section_id: value }))}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => {
                  const id = uuidValue(s.id)
                  return (
                    <SelectItem key={id} value={id}>{s.name}</SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Weekday</Label>
            <Select value={form.weekday} onValueChange={(value) => setForm((prev) => ({ ...prev, weekday: value }))}>
              <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d) => (
                  <SelectItem key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start</Label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>End</Label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={form.subject_id} onValueChange={(value) => setForm((prev) => ({ ...prev, subject_id: value }))}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => {
                  const id = uuidValue(s.id)
                  return (
                    <SelectItem key={id} value={id}>{s.name}</SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={form.teacher_id} onValueChange={(value) => setForm((prev) => ({ ...prev, teacher_id: value }))}>
              <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => {
                  const id = uuidValue(teacher.id)
                  return (
                    <SelectItem key={id} value={id}>{teacher.full_name}</SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Room</Label>
            <Input value={form.room} onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))} placeholder="Room 204" />
          </div>

          <div className="flex items-end">
            <Button onClick={addEntry} className="w-full">Add Entry</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Current Timetable
            <Badge variant="secondary">{visibleEntries.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading timetable...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No schedule entries found.</TableCell>
                  </TableRow>
                ) : (
                  visibleEntries
                    .slice()
                    .sort((a, b) => {
                      const dayDiff = WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday)
                      if (dayDiff !== 0) return dayDiff
                      return a.start_time.localeCompare(b.start_time)
                    })
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="capitalize">{entry.weekday}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.start_time} - {entry.end_time}</TableCell>
                        <TableCell>{classMap.get(entry.class_id) || "-"}</TableCell>
                        <TableCell>{sectionMap.get(entry.section_id) || "-"}</TableCell>
                        <TableCell>{subjectMap.get(entry.subject_id) || "-"}</TableCell>
                        <TableCell>{teacherMap.get(entry.teacher_id) || "-"}</TableCell>
                        <TableCell>{entry.room || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)} aria-label="Delete entry">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

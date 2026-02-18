"use client"

import { useEffect, useMemo, useState } from "react"
import {
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@schoolerp/ui"
import { Loader2, RefreshCw, School } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface AcademicYearRow {
  id: unknown
  name: string
  start_date: unknown
  end_date: unknown
  is_active: unknown
}

interface ClassRow {
  id: unknown
  name: string
  level: unknown
  stream: unknown
}

interface SectionRow {
  id: unknown
  name: string
  class_id: unknown
}

interface SubjectRow {
  id: unknown
  name: string
  code: unknown
  type: unknown
}

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const numberValue = (value: unknown) => {
  if (typeof value === "number") return value
  if (value && typeof value === "object" && "Int32" in value) {
    const v = (value as { Int32?: number }).Int32
    return typeof v === "number" ? v : 0
  }
  return 0
}

const boolValue = (value: unknown) => {
  if (typeof value === "boolean") return value
  if (value && typeof value === "object" && "Bool" in value) {
    return Boolean((value as { Bool?: boolean }).Bool)
  }
  return false
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

const dateValue = (value: unknown) => {
  if (typeof value === "string") return value.slice(0, 10)
  if (value && typeof value === "object" && "Time" in value) {
    const t = (value as { Time?: string }).Time
    if (!t) return "-"
    return t.slice(0, 10)
  }
  return "-"
}

export default function MasterDataSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingYear, setSavingYear] = useState(false)
  const [savingClass, setSavingClass] = useState(false)
  const [savingSection, setSavingSection] = useState(false)
  const [savingSubject, setSavingSubject] = useState(false)
  const [error, setError] = useState("")

  const [years, setYears] = useState<AcademicYearRow[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sections, setSections] = useState<SectionRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])

  const [selectedClassID, setSelectedClassID] = useState("")

  const [yearForm, setYearForm] = useState({ name: "", start_date: "", end_date: "" })
  const [classForm, setClassForm] = useState({ name: "", level: "1", stream: "" })
  const [sectionForm, setSectionForm] = useState({ name: "" })
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", type: "core" })

  const classOptions = useMemo(
    () => classes.map((c) => ({ id: uuidValue(c.id), label: `${c.name} (Level ${numberValue(c.level)})` })),
    [classes]
  )

  const fetchSections = async (classID: string) => {
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

  const fetchAll = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const [yearsRes, classesRes, subjectsRes] = await Promise.all([
        apiClient("/admin/academic-structure/academic-years"),
        apiClient("/admin/academic-structure/classes"),
        apiClient("/admin/academic-structure/subjects"),
      ])

      if (!yearsRes.ok) throw new Error((await yearsRes.text()) || "Failed to load academic years")
      if (!classesRes.ok) throw new Error((await classesRes.text()) || "Failed to load classes")
      if (!subjectsRes.ok) throw new Error((await subjectsRes.text()) || "Failed to load subjects")

      const [yearsData, classesData, subjectsData] = await Promise.all([
        yearsRes.json(),
        classesRes.json(),
        subjectsRes.json(),
      ])

      const loadedClasses = Array.isArray(classesData) ? classesData : []
      setYears(Array.isArray(yearsData) ? yearsData : [])
      setClasses(loadedClasses)
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])

      const firstClassID = loadedClasses.length > 0 ? uuidValue(loadedClasses[0].id) : ""
      const nextClassID = selectedClassID || firstClassID
      setSelectedClassID(nextClassID)

      if (nextClassID) {
        await fetchSections(nextClassID)
      } else {
        setSections([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load master data"
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAll(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createAcademicYear = async () => {
    if (!yearForm.name || !yearForm.start_date || !yearForm.end_date) {
      setError("Academic year requires name, start date, and end date")
      return
    }
    setSavingYear(true)
    setError("")
    try {
      const res = await apiClient("/admin/academic-structure/academic-years", {
        method: "POST",
        body: JSON.stringify(yearForm),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to create academic year")
      setYearForm({ name: "", start_date: "", end_date: "" })
      await fetchAll(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create academic year"
      setError(message)
    } finally {
      setSavingYear(false)
    }
  }

  const createClass = async () => {
    if (!classForm.name) {
      setError("Class name is required")
      return
    }
    setSavingClass(true)
    setError("")
    try {
      const res = await apiClient("/admin/academic-structure/classes", {
        method: "POST",
        body: JSON.stringify({
          name: classForm.name,
          level: Number(classForm.level) || 1,
          stream: classForm.stream,
        }),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to create class")
      setClassForm({ name: "", level: "1", stream: "" })
      await fetchAll(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create class"
      setError(message)
    } finally {
      setSavingClass(false)
    }
  }

  const createSection = async () => {
    if (!selectedClassID) {
      setError("Select a class before adding sections")
      return
    }
    if (!sectionForm.name) {
      setError("Section name is required")
      return
    }
    setSavingSection(true)
    setError("")
    try {
      const res = await apiClient(`/admin/academic-structure/classes/${selectedClassID}/sections`, {
        method: "POST",
        body: JSON.stringify({ name: sectionForm.name }),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to create section")
      setSectionForm({ name: "" })
      await fetchSections(selectedClassID)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create section"
      setError(message)
    } finally {
      setSavingSection(false)
    }
  }

  const createSubject = async () => {
    if (!subjectForm.name) {
      setError("Subject name is required")
      return
    }
    setSavingSubject(true)
    setError("")
    try {
      const res = await apiClient("/admin/academic-structure/subjects", {
        method: "POST",
        body: JSON.stringify(subjectForm),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to create subject")
      setSubjectForm({ name: "", code: "", type: "core" })
      await fetchAll(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create subject"
      setError(message)
    } finally {
      setSavingSubject(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
          <p className="text-sm text-muted-foreground">Configure academic years, classes, sections, and subjects.</p>
        </div>
        <Button variant="outline" onClick={() => fetchAll(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="years" className="space-y-6">
        <TabsList>
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="classes">Classes & Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="years" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Academic Year</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Name</Label>
                <Input
                  value={yearForm.name}
                  onChange={(e) => setYearForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="2026-27"
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={yearForm.start_date}
                  onChange={(e) => setYearForm((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={yearForm.end_date}
                  onChange={(e) => setYearForm((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              <div className="md:col-span-4">
                <Button onClick={createAcademicYear} disabled={savingYear || loading} className="gap-2">
                  {savingYear && <Loader2 className="h-4 w-4 animate-spin" />} Create Academic Year
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Years</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : years.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No academic years found.</TableCell>
                    </TableRow>
                  ) : (
                    years.map((year) => (
                      <TableRow key={uuidValue(year.id) || year.name}>
                        <TableCell className="font-medium">{year.name}</TableCell>
                        <TableCell>{dateValue(year.start_date)}</TableCell>
                        <TableCell>{dateValue(year.end_date)}</TableCell>
                        <TableCell>{boolValue(year.is_active) ? "Active" : "Inactive"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Class</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  value={classForm.name}
                  onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Grade 10"
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Input
                  type="number"
                  min={1}
                  value={classForm.level}
                  onChange={(e) => setClassForm((prev) => ({ ...prev, level: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stream</Label>
                <Input
                  value={classForm.stream}
                  onChange={(e) => setClassForm((prev) => ({ ...prev, stream: e.target.value }))}
                  placeholder="Science"
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button onClick={createClass} disabled={savingClass || loading} className="gap-2 w-full">
                  {savingClass && <Loader2 className="h-4 w-4 animate-spin" />} Create Class
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Stream</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No classes found.</TableCell>
                    </TableRow>
                  ) : (
                    classes.map((row) => (
                      <TableRow key={uuidValue(row.id) || row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{numberValue(row.level)}</TableCell>
                        <TableCell>{textValue(row.stream) || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Section</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={selectedClassID}
                  onValueChange={async (value) => {
                    setSelectedClassID(value)
                    try {
                      setError("")
                      await fetchSections(value)
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Failed to load sections"
                      setError(message)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section Name</Label>
                <Input
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ name: e.target.value })}
                  placeholder="A"
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button onClick={createSection} disabled={savingSection || !selectedClassID} className="gap-2 w-full">
                  {savingSection && <Loader2 className="h-4 w-4 animate-spin" />} Create Section
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No sections found for selected class.</TableCell>
                    </TableRow>
                  ) : (
                    sections.map((row) => (
                      <TableRow key={uuidValue(row.id) || row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="font-mono text-xs">{uuidValue(row.class_id) || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Subject</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="MATH-101"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={subjectForm.type}
                  onValueChange={(value) => setSubjectForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end">
                <Button onClick={createSubject} disabled={savingSubject || loading} className="gap-2 w-full">
                  {savingSubject && <Loader2 className="h-4 w-4 animate-spin" />} Create Subject
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No subjects found.</TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((subject) => (
                      <TableRow key={uuidValue(subject.id) || `${subject.name}-${textValue(subject.code)}`}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>{textValue(subject.code) || "-"}</TableCell>
                        <TableCell className="capitalize">{textValue(subject.type) || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading master data...
        </div>
      )}

      {!loading && years.length === 0 && classes.length === 0 && subjects.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground flex items-center gap-2">
            <School className="h-4 w-4" />
            No master data configured yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Plus,
  Search,
  Youtube,
  Link as LinkIcon,
  Trash2,
  BookOpen,
  X,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@schoolerp/ui";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description?: string;
  resource_type: string;
  url: string;
  class_id?: string;
  section_id?: string;
  subject_id?: string;
  class_name?: string;
  subject_name?: string;
  is_active: boolean;
  created_at: string;
}

interface ClassRow {
  id: string;
  name: string;
}

interface SubjectRow {
  id: string;
  name: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    resource_type: "video_link",
    url: "",
    class_id: "",
    subject_id: "",
  });

  useEffect(() => {
    fetchResources();
    fetchOptions();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterClass !== "all") params.set("class_id", filterClass);
      if (filterSubject !== "all") params.set("subject_id", filterSubject);
      const res = await apiClient(`/admin/resources?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResources(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        apiClient("/admin/foundation/classes"),
        apiClient("/admin/academics/subjects"),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setClasses(Array.isArray(data) ? data : []);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        setSubjects(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [filterClass, filterSubject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) {
      toast.error("Title and URL are required");
      return;
    }
    setCreating(true);
    try {
      const res = await apiClient("/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Resource created successfully");
        setDialogOpen(false);
        setForm({ title: "", description: "", resource_type: "video_link", url: "", class_id: "", subject_id: "" });
        fetchResources();
      } else {
        toast.error("Failed to create resource");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      const res = await apiClient(`/admin/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Resource deleted");
        fetchResources();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const filtered = resources.filter((r) => {
    if (filterType !== "all" && r.resource_type !== filterType) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeIcon = (type: string) => {
    if (type === "video_link") return <Youtube className="h-5 w-5" />;
    if (type === "file") return <FileText className="h-5 w-5" />;
    return <LinkIcon className="h-5 w-5" />;
  };

  const typeColor = (type: string) => {
    if (type === "video_link") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (type === "file") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Learning Resources
          </h1>
          <p className="text-slate-400 mt-1">Central repository for study materials, videos, and worksheets.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-500">
              <Upload className="mr-2 h-4 w-4" /> Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Add Learning Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  className="bg-slate-950 border-slate-800"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Introduction to Algebra"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  className="bg-slate-950 border-slate-800"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.resource_type} onValueChange={(v) => setForm({ ...form, resource_type: v })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video_link">Video Link</SelectItem>
                      <SelectItem value="file">File / PDF</SelectItem>
                      <SelectItem value="document_link">Document Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input
                    className="bg-slate-950 border-slate-800"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={creating} className="w-full bg-amber-600 hover:bg-amber-500">
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Resource
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filters Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Class / Grade</label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Resource Type</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { value: "all", label: "All" },
                    { value: "video_link", label: "Videos" },
                    { value: "file", label: "PDFs" },
                    { value: "document_link", label: "Links" },
                  ].map((t) => (
                    <Button
                      key={t.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterType(t.value)}
                      className={cn(
                        "border-slate-800 rounded-full text-[10px] h-7 px-3",
                        filterType === t.value ? "bg-amber-600/20 border-amber-500 text-amber-400" : "bg-slate-950"
                      )}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                variant="default"
                className="w-full bg-slate-800 hover:bg-slate-700 mt-2"
                onClick={() => {
                  setFilterClass("all");
                  setFilterSubject("all");
                  setFilterType("all");
                  setSearch("");
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">Resource Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">{resources.length}</div>
              <p className="text-xs text-slate-500 mt-1">Total materials uploaded</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search materials, videos, exam papers..."
              className="bg-slate-900 border-slate-800 pl-10 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-16 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 text-lg font-medium">No resources found</p>
                <p className="text-slate-600 text-sm mt-1">Upload your first material to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((res) => (
                <Card
                  key={res.id}
                  className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors group overflow-hidden"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div
                        className={cn(
                          "h-10 w-10 flex items-center justify-center rounded-lg border",
                          typeColor(res.resource_type)
                        )}
                      >
                        {typeIcon(res.resource_type)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 group-hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(res.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-bold text-slate-200 line-clamp-1">{res.title}</h3>
                    {res.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{res.description}</p>
                    )}
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {res.subject_name || "General"}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        {res.class_name || "All Classes"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] h-8 border-slate-800 hover:bg-slate-800"
                        onClick={() => window.open(res.url, "_blank")}
                      >
                        {res.resource_type === "video_link" ? "Watch Now" : "Open / Download"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

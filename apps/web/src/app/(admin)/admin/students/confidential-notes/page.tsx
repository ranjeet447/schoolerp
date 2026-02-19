"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Lock,
  Plus,
  Trash2,
  Loader2,
  ShieldAlert,
  User,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@schoolerp/ui";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface ConfidentialNote {
  id: string;
  note: string;
  is_sensitive: boolean;
  author_name: string;
  created_at: string;
}

export default function ConfidentialNotesPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student_id") || "";
  const studentName = searchParams.get("name") || "Student";

  const [notes, setNotes] = useState<ConfidentialNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSensitive, setIsSensitive] = useState(false);

  useEffect(() => {
    if (studentId) fetchNotes();
  }, [studentId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/admin/safety/notes/student/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }
    setCreating(true);
    try {
      const res = await apiClient(`/admin/safety/notes/student/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText, is_sensitive: isSensitive }),
      });
      if (res.ok) {
        toast.success("Note added");
        setDialogOpen(false);
        setNoteText("");
        setIsSensitive(false);
        fetchNotes();
      } else {
        toast.error("Failed to add note");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this confidential note? This cannot be undone.")) return;
    try {
      const res = await apiClient(`/admin/safety/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Note deleted");
        fetchNotes();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
            Confidential Notes
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <User className="h-4 w-4" /> {studentName}
            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 rounded-full text-[10px]">
              <Lock className="h-3 w-3 mr-1" /> Admin Only
            </Badge>
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-500">
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Add Confidential Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Note</Label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-sm min-h-[120px] text-white"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter a private note about this student..."
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span className="text-sm">Mark as sensitive</span>
                </div>
                <Switch checked={isSensitive} onCheckedChange={setIsSensitive} />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-rose-600 hover:bg-rose-500"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Save Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!studentId ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 text-center">
            <Lock className="h-12 w-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">No student selected.</p>
            <p className="text-slate-600 text-sm mt-1">Navigate here from a student profile to view notes.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
        </div>
      ) : notes.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 text-center">
            <Lock className="h-12 w-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">No confidential notes yet.</p>
            <p className="text-slate-600 text-sm mt-1">Add your first note using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={cn(
                "bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors",
                note.is_sensitive && "border-amber-500/30"
              )}
            >
              <CardContent className="pt-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {note.is_sensitive && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 rounded-full text-[10px] mb-2">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Sensitive
                      </Badge>
                    )}
                    <p className="text-slate-200 whitespace-pre-wrap">{note.note}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {note.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

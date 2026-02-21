"use client";

import { Suspense, useState, useEffect } from "react";
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

function ConfidentialNotesPageContent() {
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
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
            Confidential Notes
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <User className="h-4 w-4" /> {studentName}
            <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/30 rounded-full text-[10px]">
              <Lock className="h-3 w-3 mr-1" /> Admin Only
            </Badge>
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-500 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Confidential Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Note</Label>
                <textarea
                  className="w-full bg-muted/50 border border-border/50 rounded-md p-3 text-sm min-h-[120px] text-foreground focus:outline-none focus:border-rose-500 transition-colors"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter a private note about this student..."
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Mark as sensitive</span>
                </div>
                <Switch checked={isSensitive} onCheckedChange={setIsSensitive} />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Save Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!studentId ? (
        <Card className="bg-card">
          <CardContent className="py-16 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg font-medium">No student selected.</p>
            <p className="text-muted-foreground text-sm mt-1">Navigate here from a student profile to view notes.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      ) : notes.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="py-16 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg font-medium">No confidential notes yet.</p>
            <p className="text-muted-foreground text-sm mt-1">Add your first note using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={cn(
                "bg-card hover:border-border/80 transition-colors shadow-sm",
                note.is_sensitive && "border-amber-500/30"
              )}
            >
              <CardContent className="pt-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {note.is_sensitive && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 rounded-full text-[10px] mb-2 font-bold uppercase tracking-wider">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Sensitive
                      </Badge>
                    )}
                    <p className="text-foreground whitespace-pre-wrap">{note.note}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
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
                    className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
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

export default function ConfidentialNotesPage() {
  return (
    <Suspense fallback={null}>
      <ConfidentialNotesPageContent />
    </Suspense>
  );
}

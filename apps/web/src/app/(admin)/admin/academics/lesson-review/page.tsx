"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Loader2,
  CheckCircle,
  RotateCcw,
  Clock,
  MessageSquare,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@schoolerp/ui";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface LessonPlan {
  id: string;
  subject_name: string;
  class_name: string;
  week_number: number;
  planned_topic: string;
  covered_at: string | null;
  review_status: string;
  review_remarks?: { String: string; Valid: boolean };
  created_at: string;
}

interface ClassRow { id: string; name: string; }
interface SubjectRow { id: string; name: string; }

export default function LessonPlanReviewPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [reviewDialog, setReviewDialog] = useState<LessonPlan | null>(null);
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calendar, setCalendar] = useState<any[]>([]);

  useEffect(() => {
    fetchOptions();
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    try {
      const res = await apiClient("/admin/academics/calendar");
      if (res.ok) {
        const data = await res.json();
        setCalendar(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchPlans();
    }
  }, [selectedClass, selectedSubject]);

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

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await apiClient(
        `/admin/academics/lesson-plans?subject_id=${selectedSubject}&class_id=${selectedClass}`
      );
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewDialog) return;
    setSubmitting(true);
    try {
      const res = await apiClient(`/admin/academics/lesson-plans/${reviewDialog.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reviewStatus, remarks: reviewRemarks }),
      });
      if (res.ok) {
        toast.success(`Lesson plan ${reviewStatus}`);
        setReviewDialog(null);
        setReviewRemarks("");
        fetchPlans();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 rounded-full"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "returned":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30 rounded-full"><RotateCcw className="h-3 w-3 mr-1" />Returned</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 rounded-full"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
          Lesson Plan Review
        </h1>
        <p className="text-slate-400 mt-1">
          Coordinator review and approval of weekly lesson plans.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-400">Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="bg-slate-900 border-slate-800">
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
          <Label className="text-slate-400">Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-slate-900 border-slate-800">
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

      {/* Plans Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-400" /> Weekly Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedClass || !selectedSubject ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Select a class and subject to view lesson plans.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400">No lesson plans found for this selection.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Week</TableHead>
                  <TableHead className="text-slate-400">Topic</TableHead>
                  <TableHead className="text-slate-400">Covered</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const weekInfo = calendar.find(w => w.week_number === plan.week_number);
                  const isHoliday = weekInfo?.is_holiday;
                  return (
                    <TableRow key={plan.id} className={cn("border-slate-800 hover:bg-slate-800/50", isHoliday && "bg-amber-500/5")}>
                      <TableCell className="font-bold text-slate-200">
                        <div className="flex flex-col">
                          <span>Wk {plan.week_number}</span>
                          {isHoliday && (
                            <span className="text-[10px] text-amber-500 font-medium">Holiday Week</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-[250px] truncate">{plan.planned_topic}</TableCell>
                      <TableCell>
                        {plan.covered_at ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 rounded-full text-[10px]">Yes</Badge>
                        ) : (
                          <Badge className="bg-slate-800 text-slate-500 rounded-full text-[10px]">Not yet</Badge>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(plan.review_status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-800 hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/30"
                          onClick={() => {
                            setReviewDialog(plan);
                            setReviewStatus("approved");
                            setReviewRemarks("");
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Review Lesson Plan — Week {reviewDialog?.week_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm font-bold text-slate-200">{reviewDialog?.planned_topic}</p>
              <p className="text-xs text-slate-500 mt-1">
                {reviewDialog?.subject_name} • {reviewDialog?.class_name}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">✅ Approve</SelectItem>
                  <SelectItem value="returned">↩️ Return for revision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                className="bg-slate-950 border-slate-800"
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Optional feedback for the teacher..."
              />
            </div>

            <Button
              onClick={handleReview}
              disabled={submitting}
              className={cn(
                "w-full font-bold",
                reviewStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
              )}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {reviewStatus === "approved" ? "Approve" : "Return"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

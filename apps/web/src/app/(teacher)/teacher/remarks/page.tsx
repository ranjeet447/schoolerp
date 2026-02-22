"use client"

import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  Search, 
  MessageSquare, 
  Plus, 
  History, 
  User,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Flag,
  Sparkles,
  ChevronRight,
  Filter,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge, 
  Input, 
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ClassSectionOption {
  id: string;
  label: string;
}

interface Student {
  student_id: string;
  student_name: string;
  roll_number: string;
}

interface Remark {
  id: string;
  student_name: string;
  category: string;
  remark_text: string;
  created_at: string;
  posted_by_name: string;
}

const CATEGORIES = [
  { value: "behavior", label: "Behavioral", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
  { value: "academic", label: "Academic", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-50" },
  { value: "achievement", label: "Achievement", icon: Flag, color: "text-emerald-500", bg: "bg-emerald-50" },
  { value: "discipline", label: "Discipline", icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50" },
];

export default function TeacherRemarksPage() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<ClassSectionOption[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create Remark Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [remarkForm, setRemarkForm] = useState({
    category: "behavior",
    text: "",
    requiresAck: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Remarks History (for selected student)
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchStudents();
    }
  }, [selectedSection]);

  const fetchSections = async () => {
    try {
      const res = await apiClient("/teacher/attendance/class-sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data || []);
        if (data.length > 0) setSelectedSection(data[0].id);
      }
    } catch (err) {
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiClient(`/teacher/attendance/sessions?class_section_id=${selectedSection}&date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.entries || []);
      }
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchStudentRemarks = async (studentId: string) => {
    setLoadingRemarks(true);
    try {
      const res = await apiClient(`/teacher/students/${studentId}/remarks`);
      if (res.ok) {
        const data = await res.json();
        setRemarks(data || []);
      }
    } catch (err) {
      toast.error("Failed to load remark history");
    } finally {
      setLoadingRemarks(false);
    }
  };

  const handleOpenRemarkModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    fetchStudentRemarks(student.student_id);
  };

  const handleSubmitRemark = async () => {
    if (!selectedStudent || !remarkForm.text.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiClient("/teacher/remarks", {
        method: "POST",
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          category: remarkForm.category,
          remark_text: remarkForm.text,
          requires_ack: remarkForm.requiresAck
        })
      });
      if (res.ok) {
        toast.success("Remark posted successfully");
        setRemarkForm({ ...remarkForm, text: "" });
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error("Failed to post remark");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll_number.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-slate-500 font-medium font-outfit">Loading your roster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-0.5 font-black uppercase text-[10px] tracking-widest">Behavioral Portal</Badge>
          </div>
          <h1 className="text-4xl font-black text-slate-900 font-outfit">Student Remarks</h1>
          <p className="text-slate-500 font-medium mt-1">Post behavioral logs and periodic academic observations for your students.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-[240px] h-12 rounded-2xl border-emerald-100 bg-slate-50 shadow-sm font-bold">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Filters & Stats */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-emerald-100 shadow-sm">
            <CardHeader className="p-6 pb-0">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Search Filter</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Student name or roll..." 
                  className="pl-11 h-12 rounded-2xl border-slate-100 focus:ring-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="pt-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Categories</p>
                 <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <Badge key={cat.value} className={`${cat.bg} ${cat.color} border-none font-bold px-3 py-1 cursor-pointer hover:opacity-80`}>
                         <cat.icon className="h-3 w-3 mr-1" /> {cat.label}
                      </Badge>
                    ))}
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
             <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 mb-6">
                <Sparkles className="h-6 w-6" />
             </div>
             <h3 className="text-xl font-black font-outfit uppercase tracking-tight">E-Diary Impact</h3>
             <p className="text-slate-400 font-medium text-sm mt-2">Remarks posted here are instantly visible to parents in the mobile app feed.</p>
             <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-white">24</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase">This Month</p>
                </div>
                <Button variant="ghost" className="text-white hover:bg-white/10 gap-2 font-bold px-0">
                  Analytics <ChevronRight className="h-4 w-4" />
                </Button>
             </div>
          </Card>
        </div>

        {/* Main List */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {loadingStudents ? (
                Array.from({length: 6}).map((_, i) => (
                  <div key={i} className="h-24 rounded-[2rem] bg-slate-100 animate-pulse" />
                ))
             ) : filteredStudents.map(student => (
               <div key={student.student_id} className="group bg-white border border-emerald-50 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all flex items-center justify-between hover:border-emerald-200">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-3xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                       {student.student_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-900">{student.student_name}</h4>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Roll: {student.roll_number}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-2xl border-emerald-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 gap-2 font-black h-12 px-6"
                    onClick={() => handleOpenRemarkModal(student)}
                  >
                     <Plus className="h-4 w-4" /> Remark
                  </Button>
               </div>
             ))}
             {!loadingStudents && filteredStudents.length === 0 && (
               <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <User className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No students found matching your query.</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Remark Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-slate-900 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <MessageSquare className="h-24 w-24" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-3xl font-black font-outfit">Post Official Remark</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                   <Badge className="bg-emerald-500 text-slate-900 border-none font-black px-2 py-0.5 text-[10px] tracking-widest uppercase">{selectedStudent?.student_name}</Badge>
                   <span className="text-slate-400 text-xs font-medium italic">Will be logged in digital diary</span>
                </div>
              </DialogHeader>
           </div>
           
           <div className="p-8 space-y-8 bg-white">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Remark Category</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {CATEGORIES.map(cat => (
                     <button
                      key={cat.value}
                      onClick={() => setRemarkForm({...remarkForm, category: cat.value})}
                      className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border-2 ${remarkForm.category === cat.value ? 'bg-slate-900 border-slate-900 text-white scale-105 shadow-xl' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                     >
                        <cat.icon className={`h-6 w-6 ${remarkForm.category === cat.value ? 'text-emerald-400' : cat.color}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observational Insight</label>
                <Textarea 
                  placeholder="Describe the student's behavior or achievement in detail..." 
                  className="min-h-[140px] rounded-[2rem] border-slate-100 focus:ring-emerald-500 p-6 text-sm font-medium leading-relaxed"
                  value={remarkForm.text}
                  onChange={(e) => setRemarkForm({...remarkForm, text: e.target.value})}
                />
              </div>

              {remarks.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <History className="h-3 w-3" /> Historical Timeline
                  </label>
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                     {remarks.map(rmk => (
                       <div key={rmk.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-4">
                          <div>
                             <p className="text-xs font-bold text-slate-800 line-clamp-2">{rmk.remark_text}</p>
                             <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[8px] font-black border-slate-200">{rmk.category}</Badge>
                                <span className="text-[9px] text-slate-400 font-bold">{format(new Date(rmk.created_at), 'dd MMM yyyy')}</span>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}
           </div>

           <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                 <input 
                  type="checkbox" 
                  id="req-ack" 
                  className="h-5 w-5 rounded-lg border-emerald-500 text-emerald-500 focus:ring-emerald-500" 
                  checked={remarkForm.requiresAck}
                  onChange={(e) => setRemarkForm({...remarkForm, requiresAck: e.target.checked})}
                 />
                 <label htmlFor="req-ack" className="text-xs font-black text-slate-500 uppercase tracking-widest">Require Acknowledgement</label>
              </div>
              <Button 
                className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black px-10 h-14 text-lg shadow-xl gap-2 active:scale-95 transition-all"
                disabled={submitting || !remarkForm.text.trim()}
                onClick={handleSubmitRemark}
              >
                 {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                 Sync Diary
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

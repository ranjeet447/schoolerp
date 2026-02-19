"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  BookMarked, 
  Trophy,
  Filter,
  Loader2,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Progress
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";

interface ReadingLog {
  id: string;
  student_name: string;
  book_title: string;
  status: string;
  current_page: number;
  total_pages: number;
  rating?: number;
  updated_at: string;
}

export default function LibraryReadingPage() {
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchGlobalLogs = async () => {
    try {
      // For simplicity, we use the same endpoint but might need a global librarian view one later
      // For now, let's assume we have a list of recent logs
      const res = await apiClient("/library/reading-progress/recent");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.book_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reading Progress</h1>
          <p className="text-muted-foreground">Monitor student reading engagement and progress.</p>
        </div>
        <div className="flex gap-4">
           <Card className="px-4 py-2 flex items-center gap-3 bg-blue-50 border-blue-100 shadow-none">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                 <p className="text-[10px] uppercase font-bold text-blue-600">Active Readers</p>
                 <p className="text-lg font-black text-blue-700">{logs.length}</p>
              </div>
           </Card>
           <Card className="px-4 py-2 flex items-center gap-3 bg-green-50 border-green-100 shadow-none">
              <Trophy className="h-5 w-5 text-green-600" />
              <div>
                 <p className="text-[10px] uppercase font-bold text-green-600">Completed</p>
                 <p className="text-lg font-black text-green-700">{logs.filter(l => l.status === 'completed').length}</p>
              </div>
           </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
           <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Progress Dashboard</CardTitle>
              <div className="flex items-center gap-2">
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                       placeholder="Search student or book..." 
                       className="pl-9 w-[300px]"
                       value={search}
                       onChange={e => setSearch(e.target.value)}
                    />
                 </div>
                 <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Current Book</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No reading logs found matching search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((l) => (
                  <TableRow key={l.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                             {l.student_name?.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <span className="font-bold">{l.student_name}</span>
                       </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                       <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">{l.book_title}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Page {l.current_page} / {l.total_pages}</span>
                       </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                       <div className="space-y-1">
                          <Progress value={(l.current_page / l.total_pages) * 100} className="h-1.5" />
                          <p className="text-[9px] text-right font-medium text-muted-foreground">
                             {Math.round((l.current_page / l.total_pages) * 100)}%
                          </p>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'completed' ? 'outline' : 'secondary'} className={`text-[10px] uppercase ${l.status === 'completed' ? 'text-green-600 border-green-200 bg-green-50' : ''}`}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                       {new Date(l.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 shadow-none">
            <CardHeader>
               <CardTitle className="text-sm font-extrabold text-indigo-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Weekly Reading Velocity
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[100px] flex items-end gap-2 px-2">
                  {[45, 60, 30, 80, 55, 90, 70].map((v, i) => (
                     <div key={i} className="flex-1 bg-indigo-200 rounded-t-sm" style={{ height: `${v}%` }} />
                  ))}
               </div>
               <p className="text-[10px] text-indigo-600 font-medium mt-4 text-center">Avg. 15 pages / day system-wide</p>
            </CardContent>
         </Card>
         <Card className="bg-slate-900 text-white border-none shadow-xl">
            <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookMarked className="h-4 w-4" /> Librarian Tip
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-slate-400 leading-relaxed italic">
                  "Students with active reading journals show 24% higher engagement in literacy subjects. 
                  Encourage students to rate their books to build a better recommendation engine."
               </p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

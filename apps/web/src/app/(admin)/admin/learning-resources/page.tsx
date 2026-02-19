"use client";

import { useState } from "react";
import { 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  Youtube, 
  Link as LinkIcon, 
  Download, 
  MoreVertical,
  BookOpen,
  Filter
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@schoolerp/ui";
import { cn } from "@/lib/utils";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("all");

  const resources = [
    { id: "1", title: "Introduction to Algebra - Part 1", type: "video", subject: "Mathematics", class: "Grade 10", url: "https://youtube.com/..." },
    { id: "2", title: "Periodic Table Cheat Sheet", type: "pdf", subject: "Chemistry", class: "Grade 11", url: "https://files.school.com/..." },
    { id: "3", title: "World War II Documentary", type: "link", subject: "History", class: "Grade 10", url: "https://nationalgeographic.com/..." },
    { id: "4", title: "Python Basics for Beginners", type: "video", subject: "Computer Science", class: "Grade 9", url: "https://youtube.com/..." },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Learning Resources
          </h1>
          <p className="text-slate-400 mt-1">Central repository for study materials, videos, and worksheets.</p>
        </div>

        <div className="flex gap-2">
          <Button className="bg-amber-600 hover:bg-amber-500">
            <Upload className="mr-2 h-4 w-4" /> Upload Material
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Class / Grade</label>
                <select className="w-full bg-slate-950 border-slate-800 rounded-md h-10 px-3 text-sm">
                  <option>All Classes</option>
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                <select className="w-full bg-slate-950 border-slate-800 rounded-md h-10 px-3 text-sm">
                  <option>All Subjects</option>
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>History</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Resource Type</label>
                <div className="flex flex-wrap gap-2 pt-1">
                   <Button variant="outline" size="sm" className="border-slate-800 bg-slate-950 rounded-full text-[10px] h-7 px-3">Videos</Button>
                   <Button variant="outline" size="sm" className="border-slate-800 bg-slate-950 rounded-full text-[10px] h-7 px-3">PDFs</Button>
                   <Button variant="outline" size="sm" className="border-slate-800 bg-slate-950 rounded-full text-[10px] h-7 px-3">Links</Button>
                </div>
              </div>
              <Button variant="default" className="w-full bg-slate-800 hover:bg-slate-700 mt-2">Reset Filters</Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
             <CardHeader>
               <CardTitle className="text-sm">Storage Usage</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 <div className="flex justify-between text-xs text-slate-400">
                    <span>4.2 GB used</span>
                    <span>10 GB total</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[42%]" />
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
           <div className="relative">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
             <Input placeholder="Search shared materials, videos, exam papers..." className="bg-slate-900 border-slate-800 pl-10 h-12" />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {resources.map(res => (
               <Card key={res.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors group overflow-hidden">
                 <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                       <div className={cn(
                         "h-10 w-10 flex items-center justify-center rounded-lg border",
                         res.type === "video" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                         res.type === "pdf" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                       )}>
                         {res.type === "video" ? <Youtube className="h-5 w-5" /> : 
                          res.type === "pdf" ? <FileText className="h-5 w-5" /> : 
                          <LinkIcon className="h-5 w-5" />}
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 group-hover:text-slate-300">
                         <MoreVertical className="h-4 w-4" />
                       </Button>
                    </div>
                 </CardHeader>
                 <CardContent>
                    <h3 className="font-bold text-slate-200 line-clamp-1">{res.title}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                       <span className="text-xs text-slate-500 flex items-center gap-1"><BookOpen className="h-3 w-3" /> {res.subject}</span>
                       <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{res.class}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                       <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 border-slate-800 hover:bg-slate-800">
                         {res.type === "video" ? "Watch Now" : "Download"}
                       </Button>
                    </div>
                 </CardContent>
               </Card>
             ))}
           </div>
           
           {/* Pagination Mock */}
           <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled className="border-slate-800">Previous</Button>
              <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800">1</Button>
              <Button variant="outline" size="sm" className="border-slate-800">2</Button>
              <Button variant="outline" size="sm" className="border-slate-800">Next</Button>
           </div>
        </div>
      </div>
    </div>
  );
}

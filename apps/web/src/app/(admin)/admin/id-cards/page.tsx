"use client";

import { useState } from "react";
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Eye, 
  Printer, 
  Download,
  Layout,
  User,
  Image as ImageIcon,
  Palette,
  Type
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

export default function IDCardsPage() {
  const [activeView, setActiveView] = useState("templates");

  const templates = [
    { id: "1", name: "Standard Student ID (Vertical)", type: "Student", layout: "Portrait", isDefault: true, color: "#2563eb" },
    { id: "2", name: "Staff Pro ID (Horizontal)", type: "Employee", layout: "Landscape", isDefault: false, color: "#059669" },
    { id: "3", name: "Visitor Pass", type: "Other", layout: "Square", isDefault: false, color: "#7c3aed" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Digital ID Cards
          </h1>
          <p className="text-slate-400 mt-1">Design templates and generate smart ID cards for everyone.</p>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-500">
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
          <Button variant="outline" className="border-slate-800 bg-slate-900/50">
             <Printer className="mr-2 h-4 w-4" /> Bulk Print
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full" onValueChange={setActiveView}>
        <TabsList className="bg-slate-900 border-slate-800 mb-6 h-12">
          <TabsTrigger value="templates" className="data-[state=active]:bg-slate-800 px-6">Templates</TabsTrigger>
          <TabsTrigger value="generate" className="data-[state=active]:bg-slate-800 px-6">Generate / Issue</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-800 px-6">General Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(tpl => (
              <Card key={tpl.id} className="bg-slate-900 border-slate-800 overflow-hidden group">
                <div className="aspect-[3/4] p-6 flex flex-col items-center justify-center bg-slate-950/80 relative overflow-hidden">
                  {/* Mock ID Card Preview */}
                  <div 
                    className="w-full h-full rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
                    style={{ borderColor: `${tpl.color}40` }}
                  >
                    <div 
                       className="h-1/4 flex items-center justify-center p-3 relative"
                       style={{ background: `linear-gradient(to bottom right, ${tpl.color}, ${tpl.color}dd)` }}
                    >
                      <div className="text-[10px] font-bold text-white/50 absolute top-2 right-2">ID: TPL-{tpl.id}</div>
                      <div className="h-6 w-full bg-white/20 rounded blur-[2px]" />
                    </div>
                    <div className="flex-1 bg-slate-900 p-4 flex flex-col items-center gap-3">
                      <div className="h-20 w-20 rounded-full border-4 border-slate-800 bg-slate-800 flex items-center justify-center -mt-10 overflow-hidden">
                         <User className="h-10 w-10 text-slate-700" />
                      </div>
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto animate-pulse" />
                        <div className="h-3 bg-slate-800 rounded w-1/2 mx-auto animate-pulse" />
                      </div>
                      <div className="mt-auto h-8 w-8 bg-white/10 rounded-sm border border-slate-800" />
                    </div>
                  </div>
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-500">Edit</Button>
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Preview</Button>
                  </div>
                </div>
                
                <CardHeader className="py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{tpl.name}</CardTitle>
                    {tpl.isDefault && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-black">Default</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Layout className="h-3 w-3" /> {tpl.layout}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {tpl.type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty Template Placeholder */}
            <button className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 hover:border-slate-700 transition-all">
               <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center">
                 <Plus className="h-6 w-6" />
               </div>
               <span className="font-semibold">Create Template</span>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="generate">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Issue New ID Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Select Target</label>
                   <select className="w-full bg-slate-950 border-slate-800 rounded-md h-10 px-3 text-sm">
                     <option>Grade 10 - Section A</option>
                     <option>Grade 10 - Section B</option>
                     <option>All Teachers</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Apply Template</label>
                   <select className="w-full bg-slate-950 border-slate-800 rounded-md h-10 px-3 text-sm">
                     <option>Standard Student ID (Vertical)</option>
                     <option>Staff Pro ID (Horizontal)</option>
                   </select>
                 </div>
                 <div className="flex items-end">
                   <Button className="w-full bg-cyan-600 hover:bg-cyan-500">Search Students</Button>
                 </div>
              </div>
              
              <div className="border border-slate-800 rounded-lg p-12 text-center bg-slate-950/30">
                 <CreditCard className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                 <h3 className="text-slate-300 font-medium">Select a group to start generating ID cards</h3>
                 <p className="text-slate-500 text-sm mt-1">You can preview individual cards before final issuance.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

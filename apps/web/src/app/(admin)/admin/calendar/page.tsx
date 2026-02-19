"use client";

import { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreVertical,
  MapPin,
  Users,
  Clock,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@schoolerp/ui";
import { Button } from "@schoolerp/ui";
import { Input } from "@schoolerp/ui";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@schoolerp/ui";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from "date-fns";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Dummy events for UI demo
  const events = [
    { 
      id: "1", 
      title: "Annual Sports Meet", 
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15), 
      type: "activity", 
      location: "Main Ground" 
    },
    { 
      id: "2", 
      title: "Staff Meeting", 
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10), 
      type: "meeting", 
      location: "Conference Hall" 
    },
    { 
      id: "3", 
      title: "Independence Day", 
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15), 
      type: "holiday", 
      location: "School Campus" 
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            School Calendar
          </h1>
          <p className="text-slate-400 mt-1">Manage events, holidays, and academic activities.</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          <Button 
            variant={view === "grid" ? "default" : "ghost"} 
            size="icon" 
            onClick={() => setView("grid")}
            className={cn(view === "grid" && "bg-blue-600 hover:bg-blue-500")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={view === "list" ? "default" : "ghost"} 
            size="icon" 
            onClick={() => setView("list")}
            className={cn(view === "list" && "bg-blue-600 hover:bg-blue-500")}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-slate-800 mx-1" />
          <Button onClick={() => setIsEventModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500">
            <Plus className="mr-2 h-4 w-4" /> New Event
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 py-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-400" />
            {format(currentDate, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="border-slate-800 hover:bg-slate-800">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="border-slate-800 hover:bg-slate-800">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="border-slate-800 hover:bg-slate-800">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {view === "grid" ? (
            <div className="grid grid-cols-7 border-b border-slate-800">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-3 text-center text-sm font-medium text-slate-500 border-r border-slate-800 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
          ) : null}

          {view === "grid" ? (
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(e.date, day));
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                return (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "min-h-[140px] p-2 border-r border-b border-slate-800 last:border-r-0 transition-colors hover:bg-slate-800/30",
                      !isCurrentMonth && "bg-slate-950/50 text-slate-600",
                      isToday && "bg-blue-500/5"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                        isToday && "bg-blue-600 text-white",
                        !isToday && isCurrentMonth && "text-slate-300"
                      )}>
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id} 
                          className={cn(
                            "text-[10px] px-2 py-1 rounded truncate border",
                            event.type === "holiday" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                            event.type === "meeting" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {events.sort((a,b) => a.date.getTime() - b.date.getTime()).map(event => (
                <div key={event.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center h-14 w-14 bg-slate-800 rounded-lg border border-slate-700">
                      <span className="text-xs text-slate-400 uppercase">{format(event.date, "MMM")}</span>
                      <span className="text-xl font-bold text-white">{format(event.date, "dd")}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200">{event.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                        <span className="flex items-center gap-1 uppercase text-[10px] px-1.5 py-0.5 rounded border border-slate-700">{event.type}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="flex gap-4 p-3 rounded-lg bg-slate-800/20 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="h-10 w-10 shrink-0 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-slate-200">{event.title}</h4>
                      <span className="text-xs text-slate-500">{format(event.date, "EEE, MMM dd")}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                       <MapPin className="h-3 w-3" /> {event.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Event Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded bg-slate-800/30">
                <span className="text-slate-400 text-sm">Holidays</span>
                <span className="font-bold text-red-400">12</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded bg-slate-800/30">
                <span className="text-slate-400 text-sm">Activities</span>
                <span className="font-bold text-emerald-400">8</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded bg-slate-800/30">
                <span className="text-slate-400 text-sm">Exams</span>
                <span className="font-bold text-blue-400">4</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded bg-slate-800/30">
                <span className="text-slate-400 text-sm">Total This Month</span>
                <span className="font-bold text-white">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Event Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold italic">Create New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-400">Event Title</label>
              <Input placeholder="Enter event name..." className="bg-slate-950 border-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-400">Start Date</label>
                <Input type="date" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-400">End Date</label>
                <Input type="date" className="bg-slate-950 border-slate-800" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-400">Event Type</label>
              <select className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Activity</option>
                <option>Holiday</option>
                <option>Meeting</option>
                <option>Exam</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-400">Location</label>
              <Input placeholder="School Ground, Auditorium etc." className="bg-slate-950 border-slate-800" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsEventModalOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-500">Save Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

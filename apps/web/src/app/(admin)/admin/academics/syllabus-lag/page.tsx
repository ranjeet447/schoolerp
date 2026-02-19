"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  Clock,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
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
} from "@schoolerp/ui";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface LagItem {
  id: string;
  subject_name: string;
  class_name: string;
  week_number: number;
  planned_topic: string;
  review_status: string;
  created_at: string;
}

export default function SyllabusLagPage() {
  const [lagItems, setLagItems] = useState<LagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(4);

  useEffect(() => {
    fetchLag();
  }, [currentWeek]);

  const fetchLag = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/admin/academics/lesson-plans/lag?current_week=${currentWeek}`);
      if (res.ok) {
        const data = await res.json();
        setLagItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lagSeverity = (weekNum: number) => {
    const diff = currentWeek - weekNum;
    if (diff >= 3) return { color: "bg-red-500/10 text-red-400 border-red-500/30", label: "Critical", icon: AlertTriangle };
    if (diff >= 2) return { color: "bg-orange-500/10 text-orange-400 border-orange-500/30", label: "Behind", icon: TrendingDown };
    return { color: "bg-amber-500/10 text-amber-400 border-amber-500/30", label: "Slight", icon: Clock };
  };

  const criticalCount = lagItems.filter((i) => currentWeek - i.week_number >= 3).length;
  const behindCount = lagItems.filter((i) => currentWeek - i.week_number === 2).length;
  const slightCount = lagItems.filter((i) => currentWeek - i.week_number <= 1).length;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Syllabus Lag Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Topics scheduled in past weeks that haven't been covered yet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Current Week:</label>
          <Select value={String(currentWeek)} onValueChange={(v) => setCurrentWeek(Number(v))}>
            <SelectTrigger className="w-24 bg-slate-900 border-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Wk {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Total Lagging</p>
                <p className="text-3xl font-black text-white mt-1">{lagItems.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-400 uppercase font-bold">Critical (3+ wks)</p>
                <p className="text-3xl font-black text-red-400 mt-1">{criticalCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold">Behind (2 wks)</p>
                <p className="text-3xl font-black text-orange-400 mt-1">{behindCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 uppercase font-bold">Slight (1 wk)</p>
                <p className="text-3xl font-black text-amber-400 mt-1">{slightCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lag Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg">Uncovered Topics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : lagItems.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
              <p className="text-lg font-bold text-slate-200">All caught up!</p>
              <p className="text-sm text-slate-500">No syllabus lag detected for the current week.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Subject</TableHead>
                  <TableHead className="text-slate-400">Class</TableHead>
                  <TableHead className="text-slate-400">Week</TableHead>
                  <TableHead className="text-slate-400">Planned Topic</TableHead>
                  <TableHead className="text-slate-400">Weeks Behind</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lagItems.map((item) => {
                  const severity = lagSeverity(item.week_number);
                  const weeksBehind = currentWeek - item.week_number;
                  return (
                    <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-200">{item.subject_name}</TableCell>
                      <TableCell className="text-slate-300">{item.class_name}</TableCell>
                      <TableCell className="text-slate-400">Week {item.week_number}</TableCell>
                      <TableCell className="text-slate-300 max-w-[200px] truncate">{item.planned_topic}</TableCell>
                      <TableCell>
                        <span className="text-lg font-black text-slate-200">{weeksBehind}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-full font-bold", severity.color)}>
                          {severity.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

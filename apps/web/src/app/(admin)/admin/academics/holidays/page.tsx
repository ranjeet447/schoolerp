"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Clock,
  Info
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
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";

interface Holiday {
  id: string;
  name: string;
  holiday_date: string;
  holiday_type: string;
}

export default function HolidayManagementPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", type: "public" });
  const [isSaving, setIsSaving] = useState(false);

  const fetchHolidays = async () => {
    try {
      const res = await apiClient("/academics/holidays");
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.date) return;
    setIsSaving(true);
    try {
      const res = await apiClient("/academics/holidays", {
        method: "POST",
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsAddOpen(false);
        setForm({ name: "", date: "", type: "public" });
        fetchHolidays();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      const res = await apiClient(`/academics/holidays/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchHolidays();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holiday Management</h1>
          <p className="text-muted-foreground">Manage school closures and public holidays.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Holiday
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600" /> System Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-3 text-amber-800">
            <p>Holidays automatically adjust the <strong>Lesson Planning</strong> schedules by skipping the affected weeks.</p>
            <p>Attendance records will be marked as "School Closed" for these dates.</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : holidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      No holidays declared for this session.
                    </TableCell>
                  </TableRow>
                ) : (
                  holidays.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-bold">{h.name}</TableCell>
                      <TableCell>{new Date(h.holiday_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-[10px]">
                          {h.holiday_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => handleDelete(h.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare New Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Holiday Name</Label>
              <Input 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="e.g. Diwali Break"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public Holiday</SelectItem>
                    <SelectItem value="seasonal">Seasonal Break</SelectItem>
                    <SelectItem value="emergency">Emergency Closure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

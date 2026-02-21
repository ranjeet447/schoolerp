"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Input,
  Label,
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
  DialogTrigger,
  DialogFooter,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Badge,
  Textarea
} from "@schoolerp/ui";
import { 
  FileIcon, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  Book, 
  Video, 
  Link as LinkIcon,
  Globe
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";

interface DigitalAsset {
  id: string;
  book_id: string;
  asset_type: 'pdf' | 'epub' | 'link' | 'video';
  title: string;
  url: string;
  file_size_bytes?: number;
  access_level: 'all' | 'staff' | 'students' | 'premium';
  is_active: boolean;
  created_at: string;
}

function DigitalAssetsPageContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("book_id") || "";
  const bookTitle = searchParams.get("title") || "Library Assets";

  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    asset_type: "pdf",
    title: "",
    url: "",
    access_level: "all"
  });

  const fetchAssets = async () => {
    if (!bookId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient(`/admin/library/books/${bookId}/assets`);
      if (res.ok) {
        const data = await res.json();
        setAssets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [bookId]);

  const handleCreate = async () => {
    if (!formData.title || !formData.url) {
      toast.error("Title and URL are required");
      return;
    }
    try {
      const res = await apiClient(`/admin/library/books/${bookId}/assets`, {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Asset added successfully");
        setIsCreateOpen(false);
        setFormData({ asset_type: "pdf", title: "", url: "", access_level: "all" });
        fetchAssets();
      } else {
        toast.error("Failed to add asset");
      }
    } catch (err) {
      toast.error("Failed to add asset");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this digital asset?")) return;
    try {
      const res = await apiClient(`/admin/library/assets/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Asset removed");
        fetchAssets();
      } else {
        toast.error("Failed to remove asset");
      }
    } catch (err) {
      toast.error("Failed to remove asset");
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-rose-500" />;
      case 'link': return <LinkIcon className="w-4 h-4 text-blue-500" />;
      default: return <FileIcon className="w-4 h-4 text-amber-500" />;
    }
  };

  if (!bookId) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto mt-20 border-none shadow-sm text-center p-12 space-y-4">
          <Globe className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
          <h2 className="text-xl font-bold">No Book Selected</h2>
          <p className="text-muted-foreground">Please select a book from the catalog to manage its digital assets.</p>
          <Button asChild variant="outline">
            <a href="/admin/library/books">Go to Catalog</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Assets</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Book className="w-4 h-4" /> {bookTitle}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Digital Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Resource for {bookTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select 
                    value={formData.asset_type} 
                    onValueChange={(val) => setFormData({ ...formData, asset_type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="epub">ePub eBook</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="video">Instructional Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select 
                    value={formData.access_level} 
                    onValueChange={(val) => setFormData({ ...formData, access_level: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="students">Students only</SelectItem>
                      <SelectItem value="staff">Staff only</SelectItem>
                      <SelectItem value="premium">Premium users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Resource Title</Label>
                <Input 
                  placeholder="e.g. Study Guide, Video Tutorial..." 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Resource URL / File Link</Label>
                <Input 
                  placeholder="https://..." 
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save Asset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground italic">Fetching digital resources...</div>
          ) : assets.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <FileIcon className="w-8 h-8 opacity-20" />
              <p>No digital assets found for this book.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-muted-foreground">Resource</TableHead>
                  <TableHead className="font-bold text-muted-foreground">Type</TableHead>
                  <TableHead className="font-bold text-muted-foreground">Access</TableHead>
                  <TableHead className="font-bold text-muted-foreground">Added On</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {assets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        {getAssetIcon(asset.asset_type)}
                        <span>{asset.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase text-xs font-bold text-muted-foreground">{asset.asset_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-muted-foreground">{asset.access_level}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(asset.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
                          <a href={asset.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DigitalAssetsPage() {
  return (
    <Suspense fallback={null}>
      <DigitalAssetsPageContent />
    </Suspense>
  );
}

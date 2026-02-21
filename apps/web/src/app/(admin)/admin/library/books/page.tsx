"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Input
} from "@schoolerp/ui"
import { Plus, BookOpen, Search, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Book } from "@/types/library"
import { BookDialog } from "@/components/library/book-dialog"
import Link from "next/link"

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const res = await apiClient("/admin/library/books?limit=50")
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to load library books")
      }
      const data = await res.json()
      setBooks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load library books")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleEdit = (book: Book) => {
    setSelectedBook(book)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedBook(null)
    setDialogOpen(true)
  }

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.includes(searchTerm) ||
    book.publisher?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableCopies = books.reduce((sum, book) => sum + (book.available_copies || 0), 0)
  const totalCopies = books.reduce((sum, book) => sum + (book.total_copies || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Catalog</h1>
          <p className="text-muted-foreground">Manage books, periodicals, and digital assets.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchBooks(true)} disabled={refreshing} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Book
            </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Catalog Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{books.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Copies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{availableCopies}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Copies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{totalCopies}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Books ({books.length})</CardTitle>
            <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by title, ISBN, or publisher..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-muted-foreground">Title</TableHead>
                <TableHead className="font-bold text-muted-foreground">ISBN</TableHead>
                <TableHead className="font-bold text-muted-foreground">Category</TableHead>
                <TableHead className="font-bold text-muted-foreground">Copies</TableHead>
                <TableHead className="font-bold text-muted-foreground">Location</TableHead>
                <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading catalog...
                  </TableCell>
                </TableRow>
              ) : filteredBooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No books found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBooks.map((book) => (
                  <TableRow key={book.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <div className="font-semibold text-foreground">{book.title}</div>
                            <div className="text-xs text-muted-foreground font-medium">{book.publisher} ({book.published_year})</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground font-medium">{book.isbn || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-muted-foreground">{book.category_id || "General"}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={book.available_copies > 0 ? "outline" : "secondary"} className={book.available_copies > 0 ? "text-emerald-600 border-emerald-600/20 bg-emerald-600/10 dark:text-emerald-400" : ""}>
                            {book.available_copies} / {book.total_copies}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium text-sm">{book.shelf_location || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={book.status === 'active' ? 'default' : 'secondary'} className={book.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-600/80' : ''}>
                        {book.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
                          <Link href={`/admin/library/digital-assets?book_id=${book.id}&title=${encodeURIComponent(book.title)}`}>
                            Assets
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(book)}>
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BookDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchBooks}
        book={selectedBook}
      />
    </div>
  )
}

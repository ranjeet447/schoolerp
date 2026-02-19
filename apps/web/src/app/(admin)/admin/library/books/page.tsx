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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catalog Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Copies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCopies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Copies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCopies}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Books ({books.length})</CardTitle>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <div className="font-semibold">{book.title}</div>
                            <div className="text-xs text-muted-foreground">{book.publisher} ({book.published_year})</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{book.isbn || "-"}</TableCell>
                    <TableCell>{book.category_id || "General"}</TableCell>
                    <TableCell>
                        <Badge variant={book.available_copies > 0 ? "outline" : "secondary"}>
                            {book.available_copies} / {book.total_copies}
                        </Badge>
                    </TableCell>
                    <TableCell>{book.shelf_location || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={book.status === 'active' ? 'default' : 'secondary'}>
                        {book.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
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

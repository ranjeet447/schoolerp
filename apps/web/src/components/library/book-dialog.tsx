"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { Author, Book, Category } from "@/types/library"
import { toast } from "sonner"

interface BookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  book?: Book | null
}

export function BookDialog({ open, onOpenChange, onSuccess, book }: BookDialogProps) {
  const [loading, setLoading] = useState(false)
  const [depsLoading, setDepsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [authors, setAuthors] = useState<Author[]>([])

  const bytesToUuid = (bytes: number[]) => {
    if (bytes.length !== 16) return ""
    const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  const idValue = (value: unknown) => {
    if (typeof value === "string") return value
    if (value && typeof value === "object" && "Bytes" in value) {
      const bytes = (value as { Bytes?: unknown }).Bytes
      if (Array.isArray(bytes) && bytes.every((item) => typeof item === "number")) {
        return bytesToUuid(bytes as number[])
      }
    }
    return ""
  }

  const fetchDependencies = async () => {
    setDepsLoading(true)
    try {
      const [categoriesRes, authorsRes] = await Promise.all([
        apiClient("/admin/library/categories"),
        apiClient("/admin/library/authors"),
      ])

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(Array.isArray(data) ? data : [])
      } else {
        setCategories([])
      }

      if (authorsRes.ok) {
        const data = await authorsRes.json()
        setAuthors(Array.isArray(data) ? data : [])
      } else {
        setAuthors([])
      }
    } catch {
      toast.error("Failed to load library categories/authors")
      setCategories([])
      setAuthors([])
    } finally {
      setDepsLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    fetchDependencies()
  }, [open])
  
  const [formData, setFormData] = useState({
    title: "",
    isbn: "",
    publisher: "",
    published_year: new Date().getFullYear().toString(),
    category_id: "",
    total_copies: "1",
    shelf_location: "",
    price: "",
    language: "English",
    author_id: "" // For MVP single author
  })

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        isbn: book.isbn || "",
        publisher: book.publisher || "",
        published_year: book.published_year?.toString() || "",
        category_id: book.category_id || "",
        total_copies: book.total_copies.toString(),
        shelf_location: book.shelf_location || "",
        price: book.price?.toString() || "",
        language: book.language || "English",
        author_id: "" // Needs fetching or passing
      })
    } else {
      setFormData({
        title: "",
        isbn: "",
        publisher: "",
        published_year: new Date().getFullYear().toString(),
        category_id: "",
        total_copies: "1",
        shelf_location: "",
        price: "",
        language: "English",
        author_id: ""
      })
    }
  }, [book, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        published_year: parseInt(formData.published_year) || 0,
        total_copies: parseInt(formData.total_copies) || 1,
        price: parseFloat(formData.price) || 0
      }

      const url = book 
        ? `/admin/library/books/${book.id}` 
        : "/admin/library/books"

      const res = await apiClient(url, {
        method: book ? "PUT" : "POST",
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(book ? "Book details updated" : "Book added to library")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Failed to save book")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{book ? "Edit Book" : "Add New Book"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Book Title</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Introduction to Physics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>ISBN</Label>
              <Input 
                value={formData.isbn}
                onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                placeholder="e.g. 978-3-16-148410-0"
              />
            </div>

            <div className="space-y-2">
              <Label>Publisher</Label>
              <Input 
                value={formData.publisher}
                onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                placeholder="e.g. Oxford University Press"
              />
            </div>

            <div className="space-y-2">
              <Label>Published Year</Label>
              <Input 
                type="number"
                value={formData.published_year}
                onChange={(e) => setFormData({...formData, published_year: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Total Copies</Label>
              <Input 
                type="number"
                value={formData.total_copies}
                onChange={(e) => setFormData({...formData, total_copies: e.target.value})}
                min="1"
                required
              />
            </div>

             <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData({...formData, category_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={depsLoading ? "Loading categories..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const categoryID = idValue(category.id)
                    if (!categoryID) return null
                    return (
                      <SelectItem key={categoryID} value={categoryID}>
                        {category.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Author</Label>
              <Select
                value={formData.author_id}
                onValueChange={(val) => setFormData({...formData, author_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={depsLoading ? "Loading authors..." : "Select author"} />
                </SelectTrigger>
                <SelectContent>
                  {authors.map((author) => {
                    const authorID = idValue(author.id)
                    if (!authorID) return null
                    return (
                      <SelectItem key={authorID} value={authorID}>
                        {author.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

             <div className="space-y-2">
              <Label>Price</Label>
              <Input 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Shelf Location</Label>
              <Input 
                value={formData.shelf_location}
                onChange={(e) => setFormData({...formData, shelf_location: e.target.value})}
                placeholder="e.g. A-12-3"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Language</Label>
              <Select 
                value={formData.language} 
                onValueChange={(val) => setFormData({...formData, language: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

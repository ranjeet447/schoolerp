export interface Book {
  id: string
  tenant_id: string
  title: string
  isbn?: string
  publisher?: string
  published_year?: number
  category_id?: string
  total_copies: number
  available_copies: number
  shelf_location?: string
  cover_image_url?: string
  price?: number
  language?: string
  status: 'active' | 'lost' | 'damaged' | 'archived'
  created_at: string
  updated_at: string
}

export interface Author {
  id: string
  tenant_id: string
  name: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  parent_id?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface LibraryIssue {
  id: string
  tenant_id: string
  book_id: string
  student_id?: string
  user_id?: string
  issue_date: string
  due_date: string
  return_date?: string
  fine_amount?: number
  status: 'issued' | 'returned' | 'overdue' | 'lost'
  remarks?: string
  created_at: string
  book_title: string
  student_name?: string
  admission_number?: string
}

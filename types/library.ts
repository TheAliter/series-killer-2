/** API-shaped types (snake_case) matching Convex mappers / legacy Supabase client. */
export interface Book {
  id: string
  title: string
  series_id?: string | null
  series_order?: number | null
  status: 'reading' | 'completed' | 'want_to_read' | 'dropped'
  rating?: number | null
  notes?: string | null
  cover_url?: string | null
  read_date?: string | null
  release_date?: string | null
  user_id: string
  created_at: string
  updated_at: string
  series?: { name: string; total_books: number }
}

export interface Series {
  id: string
  name: string
  description?: string
  total_books: number
  author_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
  cover_url?: string
  books?: Book[]
  authors?: { name: string }
}

export interface Author {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface OpenLibraryBook {
  key: string
  title: string
  authors?: Array<{ name: string }>
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
  number_of_pages_median?: number
  series?: string[]
  series_key?: string[]
  series_number?: number
}

export interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[]
  numFound: number
  start: number
}

export interface BookFormData {
  title: string
  series_id?: string | null
  series_order?: number | null
  status: Book['status']
  rating?: number | null
  notes?: string | null
  cover_url?: string | null
  read_date?: string | null
  release_date?: string | null
}

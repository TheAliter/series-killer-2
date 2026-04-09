import type { OpenLibraryBook, Author } from '~/types/library'

export interface BookSearchResult {
  title: string
  cover_url?: string
  author_name?: string
  first_publish_year?: number
  series_info?: {
    name: string
    order?: number
  }
}

export function processOpenLibraryBook(book: OpenLibraryBook): BookSearchResult {
  const cover_url = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : undefined

  const author_name = book.authors?.[0]?.name || book.author_name?.[0]

  let series_info: { name: string; order?: number } | undefined
  const firstSeriesName = book.series?.[0]
  if (firstSeriesName) {
    series_info = {
      name: firstSeriesName,
      order: book.series_number || undefined,
    }
  }

  return {
    title: book.title,
    cover_url,
    author_name,
    first_publish_year: book.first_publish_year,
    series_info,
  }
}

export function findOrCreateAuthor(
  authorName: string,
  existingAuthors: readonly Author[],
): { author: Author | null; isNew: boolean } {
  if (!authorName) {
    return { author: null, isNew: false }
  }

  const existingAuthor = existingAuthors.find(
    (author) => author.name.toLowerCase() === authorName.toLowerCase(),
  )

  if (existingAuthor) {
    return { author: existingAuthor, isNew: false }
  }

  return { author: null, isNew: true }
}

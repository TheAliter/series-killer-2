import type { Doc } from '../_generated/dataModel'

function iso(ms: number): string {
  return new Date(ms).toISOString()
}

export function mapAuthor(a: Doc<'authors'>) {
  return {
    id: a.legacyId,
    name: a.name,
    user_id: a.userId,
    created_at: iso(a.createdAt),
    updated_at: iso(a.updatedAt),
  }
}

export function mapBook(
  b: Doc<'books'>,
  seriesSummary?: { name: string; total_books: number },
) {
  return {
    id: b.legacyId,
    title: b.title,
    series_id: b.seriesLegacyId ?? null,
    series_order: b.seriesOrder ?? null,
    status: b.status,
    rating: b.rating ?? null,
    notes: b.notes ?? null,
    cover_url: b.coverUrl ?? null,
    read_date: b.readDate != null ? iso(b.readDate) : null,
    release_date: b.releaseDate != null ? iso(b.releaseDate) : null,
    user_id: b.userId,
    created_at: iso(b.createdAt),
    updated_at: iso(b.updatedAt),
    series: seriesSummary,
  }
}

export function mapSeries(
  s: Doc<'series'>,
  books: Doc<'books'>[],
  authorName?: string,
) {
  return {
    id: s.legacyId,
    name: s.name,
    description: s.description,
    total_books: s.totalBooks,
    author_id: s.authorLegacyId ?? null,
    user_id: s.userId,
    created_at: iso(s.createdAt),
    updated_at: iso(s.updatedAt),
    cover_url: s.coverUrl,
    books: books.map((b) => mapBook(b)),
    authors: authorName ? { name: authorName } : undefined,
  }
}

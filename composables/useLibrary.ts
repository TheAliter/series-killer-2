import { useStore } from '@nanostores/vue'
import type { ConvexClient } from 'convex/browser'
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { api } from '../convex/_generated/api.js'
import type { Author, Book, Series } from '~/types/library'

export function useLibrary() {
  const nuxtApp = useNuxtApp()

  function getConvex(): ConvexClient {
    const client = nuxtApp.$convex as ConvexClient | undefined
    if (!client) {
      throw new Error('Convex client is only available in the browser.')
    }
    return client
  }

  const books = shallowRef<Book[]>([])
  const series = shallowRef<Series[]>([])
  const authors = shallowRef<Author[]>([])
  const loading = ref(false)

  const completedBooks = computed(() =>
    books.value.filter((b) => b.status === 'completed'),
  )
  const currentlyReading = computed(() =>
    books.value.filter((b) => b.status === 'reading'),
  )
  const wantToRead = computed(() =>
    books.value.filter((b) => b.status === 'want_to_read'),
  )
  const booksThisMonth = computed(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return completedBooks.value.filter(
      (book) =>
        book.read_date && new Date(book.read_date).getTime() >= start.getTime(),
    )
  })
  const booksThisYear = computed(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    return completedBooks.value.filter(
      (book) =>
        book.read_date && new Date(book.read_date).getTime() >= start.getTime(),
    )
  })

  let unsubBooks: { unsubscribe: () => void } | undefined
  let unsubSeries: { unsubscribe: () => void } | undefined
  let unsubAuthors: { unsubscribe: () => void } | undefined

  function subscribeQueries() {
    const convex = nuxtApp.$convex
    if (!convex) return
    unsubBooks?.unsubscribe()
    unsubSeries?.unsubscribe()
    unsubAuthors?.unsubscribe()
    unsubBooks = convex.onUpdate(api.books.list, {}, (data) => {
      books.value = data as Book[]
    })
    unsubSeries = convex.onUpdate(api.series.list, {}, (data) => {
      series.value = data as Series[]
    })
    unsubAuthors = convex.onUpdate(api.authors.list, {}, (data) => {
      authors.value = data as Author[]
    })
  }

  if (import.meta.client && nuxtApp.$authClient) {
    const session = useStore(nuxtApp.$authClient.useSession)
    watch(
      () => Boolean(session.value.data?.session),
      (signedIn) => {
        if (signedIn) subscribeQueries()
        else {
          books.value = []
          series.value = []
          authors.value = []
          unsubBooks?.unsubscribe()
          unsubSeries?.unsubscribe()
          unsubAuthors?.unsubscribe()
        }
      },
      { immediate: true },
    )
  }

  onUnmounted(() => {
    unsubBooks?.unsubscribe()
    unsubSeries?.unsubscribe()
    unsubAuthors?.unsubscribe()
  })

  async function fetchAll() {
    const convex = nuxtApp.$convex
    if (!convex) return
    loading.value = true
    try {
      const [b, s, a] = await Promise.all([
        convex.query(api.books.list, {}),
        convex.query(api.series.list, {}),
        convex.query(api.authors.list, {}),
      ])
      books.value = b as Book[]
      series.value = s as Series[]
      authors.value = a as Author[]
    } finally {
      loading.value = false
    }
  }

  async function addBook(
    payload: Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'series'> & {
      user_id?: string
    },
  ) {
    const row = await getConvex().mutation(api.books.add, {
      title: payload.title,
      series_id: payload.series_id ?? null,
      series_order: payload.series_order ?? null,
      status: payload.status,
      rating: payload.rating ?? null,
      notes: payload.notes ?? null,
      cover_url: payload.cover_url ?? null,
      read_date: payload.read_date ?? null,
      release_date: payload.release_date ?? null,
    })
    if (payload.series_id) {
      await getConvex().mutation(api.series.syncBookCount, {
        seriesLegacyId: payload.series_id,
      })
    }
    return row as Book
  }

  async function addManyBooks(
    items: Array<{
      title: string
      series_id?: string | null
      series_order?: number | null
      status: Book['status']
      legacyId?: string
    }>,
  ) {
    const created = await getConvex().mutation(api.books.addMany, { books: items })
    if (items[0]?.series_id) {
      await getConvex().mutation(api.series.syncBookCount, {
        seriesLegacyId: String(items[0].series_id),
      })
    }
    return created as Book[]
  }

  async function updateBook(
    id: string,
    updates: Partial<
      Pick<
        Book,
        | 'title'
        | 'series_id'
        | 'series_order'
        | 'status'
        | 'rating'
        | 'notes'
        | 'cover_url'
        | 'read_date'
        | 'release_date'
      >
    >,
  ) {
    const bookBefore = books.value.find((b) => b.id === id)
    const oldSeriesId = bookBefore?.series_id ?? null
    const updated = (await getConvex().mutation(api.books.update, {
      id,
      title: updates.title,
      series_id:
        updates.series_id === undefined ? undefined : updates.series_id,
      series_order:
        updates.series_order === undefined ? undefined : updates.series_order,
      status: updates.status,
      rating: updates.rating === undefined ? undefined : updates.rating,
      notes: updates.notes === undefined ? undefined : updates.notes,
      cover_url:
        updates.cover_url === undefined ? undefined : updates.cover_url,
      read_date:
        updates.read_date === undefined ? undefined : updates.read_date,
      release_date:
        updates.release_date === undefined ? undefined : updates.release_date,
    })) as Book
    const newSeriesId =
      updates.series_id !== undefined ? updates.series_id : oldSeriesId
    const touched = new Set<string>()
    if (oldSeriesId) touched.add(oldSeriesId)
    if (newSeriesId) touched.add(newSeriesId)
    for (const sid of touched) {
      if (sid)
        await getConvex().mutation(api.series.syncBookCount, {
          seriesLegacyId: sid,
        })
    }
    return updated
  }

  async function deleteBook(id: string) {
    const book = books.value.find((b) => b.id === id)
    await getConvex().mutation(api.books.remove, { id })
    if (book?.series_id) {
      await getConvex().mutation(api.series.syncBookCount, {
        seriesLegacyId: book.series_id,
      })
    }
  }

  async function addSeries(payload: {
    name: string
    description?: string
    total_books?: number
    author_id?: string | null
    cover_url?: string
  }) {
    return (await getConvex().mutation(api.series.add, {
      name: payload.name,
      description: payload.description,
      total_books: payload.total_books,
      author_id: payload.author_id ?? null,
      cover_url: payload.cover_url,
    })) as Series
  }

  async function updateSeries(
    id: string,
    updates: Partial<{
      name: string
      description: string
      total_books: number
      author_id: string | null
      cover_url: string
    }>,
  ) {
    return (await getConvex().mutation(api.series.update, {
      id,
      name: updates.name,
      description: updates.description,
      total_books: updates.total_books,
      author_id:
        updates.author_id === undefined ? undefined : updates.author_id,
      cover_url: updates.cover_url,
    })) as Series
  }

  async function deleteSeries(id: string) {
    await getConvex().mutation(api.series.remove, { id })
  }

  async function addAuthor(name: string) {
    return (await getConvex().mutation(api.authors.add, { name })) as Author
  }

  async function clearAllData() {
    await getConvex().mutation(api.library.clearAllForUser, {})
  }

  return {
    books,
    series,
    authors,
    loading,
    completedBooks,
    currentlyReading,
    wantToRead,
    booksThisMonth,
    booksThisYear,
    fetchAll,
    addBook,
    addManyBooks,
    updateBook,
    deleteBook,
    addSeries,
    updateSeries,
    deleteSeries,
    addAuthor,
    clearAllData,
  }
}

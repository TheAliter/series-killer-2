import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUserSubject } from './lib/auth'
import { mapSeries } from './lib/mappers'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserSubject(ctx)
    const seriesRows = await ctx.db
      .query('series')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    seriesRows.sort((a, b) => a.name.localeCompare(b.name))
    const books = await ctx.db
      .query('books')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const authors = await ctx.db
      .query('authors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const authorNameByLegacy = new Map(
      authors.map((a) => [a.legacyId, a.name] as const),
    )
    return seriesRows.map((s) => {
      const nested = books.filter((b) => b.seriesLegacyId === s.legacyId)
      nested.sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0))
      const authorName = s.authorLegacyId
        ? authorNameByLegacy.get(s.authorLegacyId)
        : undefined
      return mapSeries(s, nested, authorName)
    })
  },
})

export const add = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    total_books: v.optional(v.number()),
    author_id: v.optional(v.union(v.null(), v.string())),
    cover_url: v.optional(v.string()),
    legacyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserSubject(ctx)
    const now = Date.now()
    const legacyId = args.legacyId ?? crypto.randomUUID()
    const totalBooks = args.total_books ?? 0
    await ctx.db.insert('series', {
      userId,
      legacyId,
      name: args.name,
      description: args.description,
      totalBooks,
      authorLegacyId: args.author_id ?? undefined,
      coverUrl: args.cover_url,
      createdAt: now,
      updatedAt: now,
    })
    const inserted = await ctx.db
      .query('series')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', legacyId),
      )
      .unique()
    if (!inserted) throw new Error('Failed to load series')
    if (totalBooks > 0) {
      const dummy = []
      for (let i = 1; i <= totalBooks; i++) {
        dummy.push({
          title: '...',
          series_id: legacyId,
          series_order: i,
          status: 'want_to_read' as const,
        })
      }
      for (const row of dummy) {
        await ctx.db.insert('books', {
          userId,
          legacyId: crypto.randomUUID(),
          title: row.title,
          seriesLegacyId: row.series_id,
          seriesOrder: row.series_order,
          status: row.status,
          createdAt: now,
          updatedAt: now,
        })
      }
      const count = await countBooksInSeries(ctx, userId, legacyId)
      await ctx.db.patch(inserted._id, { totalBooks: count, updatedAt: Date.now() })
    }
    const books = await booksForSeries(ctx, userId, legacyId)
    const authors = await ctx.db
      .query('authors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const authorNameByLegacy = new Map(
      authors.map((a) => [a.legacyId, a.name] as const),
    )
    const refreshed = await ctx.db.get(inserted._id)
    if (!refreshed) throw new Error('Series missing')
    const authorName = refreshed.authorLegacyId
      ? authorNameByLegacy.get(refreshed.authorLegacyId)
      : undefined
    return mapSeries(refreshed, books, authorName)
  },
})

async function booksForSeries(
  ctx: import('./_generated/server').QueryCtx | import('./_generated/server').MutationCtx,
  userId: string,
  seriesLegacyId: string,
) {
  const books = await ctx.db
    .query('books')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect()
  return books.filter((b) => b.seriesLegacyId === seriesLegacyId)
}

async function countBooksInSeries(
  ctx: import('./_generated/server').QueryCtx | import('./_generated/server').MutationCtx,
  userId: string,
  seriesLegacyId: string,
) {
  const list = await booksForSeries(ctx, userId, seriesLegacyId)
  return list.length
}

export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    total_books: v.optional(v.number()),
    author_id: v.optional(v.union(v.null(), v.string())),
    cover_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserSubject(ctx)
    const existing = await ctx.db
      .query('series')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', args.id),
      )
      .unique()
    if (!existing) throw new Error('Series not found')
    const now = Date.now()
    const patch: Record<string, unknown> = { updatedAt: now }
    if (args.name !== undefined) patch.name = args.name
    if (args.description !== undefined) patch.description = args.description
    if (args.total_books !== undefined) patch.totalBooks = args.total_books
    if (args.author_id !== undefined) {
      patch.authorLegacyId =
        args.author_id === null ? undefined : args.author_id
    }
    if (args.cover_url !== undefined) patch.coverUrl = args.cover_url
    await ctx.db.patch(existing._id, patch as typeof existing)
    const updated = await ctx.db.get(existing._id)
    if (!updated) throw new Error('Series not found after update')
    const books = await booksForSeries(ctx, userId, updated.legacyId)
    const authors = await ctx.db
      .query('authors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const authorNameByLegacy = new Map(
      authors.map((a) => [a.legacyId, a.name] as const),
    )
    const authorName = updated.authorLegacyId
      ? authorNameByLegacy.get(updated.authorLegacyId)
      : undefined
    return mapSeries(updated, books, authorName)
  },
})

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await requireUserSubject(ctx)
    const existing = await ctx.db
      .query('series')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', id),
      )
      .unique()
    if (!existing) throw new Error('Series not found')
    const books = await booksForSeries(ctx, userId, id)
    const now = Date.now()
    for (const b of books) {
      await ctx.db.patch(b._id, {
        seriesLegacyId: undefined,
        seriesOrder: undefined,
        updatedAt: now,
      })
    }
    await ctx.db.delete(existing._id)
  },
})

export const syncBookCount = mutation({
  args: { seriesLegacyId: v.string() },
  handler: async (ctx, { seriesLegacyId }) => {
    const userId = await requireUserSubject(ctx)
    const seriesDoc = await ctx.db
      .query('series')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', seriesLegacyId),
      )
      .unique()
    if (!seriesDoc) throw new Error('Series not found')
    const count = await countBooksInSeries(ctx, userId, seriesLegacyId)
    await ctx.db.patch(seriesDoc._id, {
      totalBooks: count,
      updatedAt: Date.now(),
    })
  },
})

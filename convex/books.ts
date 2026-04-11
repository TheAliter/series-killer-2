import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { requireUserSubject } from './lib/auth'
import { mapBook } from './lib/mappers'

const bookStatus = v.union(
  v.literal('reading'),
  v.literal('completed'),
  v.literal('want_to_read'),
  v.literal('dropped'),
)

async function getSeriesSummary(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  seriesLegacyId: string | undefined,
): Promise<{ name: string; total_books: number } | undefined> {
  if (!seriesLegacyId) return undefined
  const series = await ctx.db
    .query('series')
    .withIndex('by_user_legacy', (q) =>
      q.eq('userId', userId).eq('legacyId', seriesLegacyId),
    )
    .unique()
  if (!series) return undefined
  return { name: series.name, total_books: series.totalBooks }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserSubject(ctx)
    const rows = await ctx.db
      .query('books')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    rows.sort((a, b) => b.createdAt - a.createdAt)
    const out = []
    for (const b of rows) {
      const summary = await getSeriesSummary(ctx, userId, b.seriesLegacyId)
      out.push(mapBook(b, summary))
    }
    return out
  },
})

export const add = mutation({
  args: {
    title: v.string(),
    series_id: v.optional(v.union(v.null(), v.string())),
    series_order: v.optional(v.union(v.null(), v.number())),
    status: bookStatus,
    rating: v.optional(v.union(v.null(), v.number())),
    notes: v.optional(v.union(v.null(), v.string())),
    cover_url: v.optional(v.union(v.null(), v.string())),
    read_date: v.optional(v.union(v.null(), v.string())),
    release_date: v.optional(v.union(v.null(), v.string())),
    legacyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserSubject(ctx)
    const now = Date.now()
    const legacyId = args.legacyId ?? crypto.randomUUID()
    const readDate =
      args.read_date != null && args.read_date !== ''
        ? Date.parse(args.read_date)
        : undefined
    const releaseDate =
      args.release_date != null && args.release_date !== ''
        ? Date.parse(args.release_date)
        : undefined
    await ctx.db.insert('books', {
      userId,
      legacyId,
      title: args.title,
      seriesLegacyId: args.series_id ?? undefined,
      seriesOrder: args.series_order ?? undefined,
      status: args.status,
      rating: args.rating ?? undefined,
      notes: args.notes ?? undefined,
      coverUrl: args.cover_url ?? undefined,
      readDate: Number.isFinite(readDate) ? readDate : undefined,
      releaseDate: Number.isFinite(releaseDate) ? releaseDate : undefined,
      createdAt: now,
      updatedAt: now,
    })
    const inserted = await ctx.db
      .query('books')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', legacyId),
      )
      .unique()
    if (!inserted) throw new Error('Failed to load book')
    const summary = await getSeriesSummary(ctx, userId, inserted.seriesLegacyId)
    return mapBook(inserted, summary)
  },
})

export const addMany = mutation({
  args: {
    books: v.array(
      v.object({
        title: v.string(),
        series_id: v.optional(v.union(v.null(), v.string())),
        series_order: v.optional(v.union(v.null(), v.number())),
        status: bookStatus,
        legacyId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { books: items }) => {
    const userId = await requireUserSubject(ctx)
    const now = Date.now()
    const created: string[] = []
    for (const item of items) {
      const legacyId = item.legacyId ?? crypto.randomUUID()
      await ctx.db.insert('books', {
        userId,
        legacyId,
        title: item.title,
        seriesLegacyId: item.series_id ?? undefined,
        seriesOrder: item.series_order ?? undefined,
        status: item.status,
        createdAt: now,
        updatedAt: now,
      })
      created.push(legacyId)
    }
    const out = []
    for (const legacyId of created) {
      const row = await ctx.db
        .query('books')
        .withIndex('by_user_legacy', (q) =>
          q.eq('userId', userId).eq('legacyId', legacyId),
        )
        .unique()
      if (row) {
        const summary = await getSeriesSummary(ctx, userId, row.seriesLegacyId)
        out.push(mapBook(row, summary))
      }
    }
    return out
  },
})

export const update = mutation({
  args: {
    id: v.string(),
    title: v.optional(v.string()),
    series_id: v.optional(v.union(v.null(), v.string())),
    series_order: v.optional(v.union(v.null(), v.number())),
    status: v.optional(bookStatus),
    rating: v.optional(v.union(v.null(), v.number())),
    notes: v.optional(v.union(v.null(), v.string())),
    cover_url: v.optional(v.union(v.null(), v.string())),
    read_date: v.optional(v.union(v.null(), v.string())),
    release_date: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserSubject(ctx)
    const existing = await ctx.db
      .query('books')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', args.id),
      )
      .unique()
    if (!existing) throw new Error('Book not found')
    const now = Date.now()
    const patch: Record<string, unknown> = { updatedAt: now }
    if (args.title !== undefined) patch.title = args.title
    if (args.series_id !== undefined) {
      patch.seriesLegacyId =
        args.series_id === null ? undefined : args.series_id
    }
    if (args.series_order !== undefined) {
      patch.seriesOrder =
        args.series_order === null ? undefined : args.series_order
    }
    if (args.status !== undefined) patch.status = args.status
    if (args.rating !== undefined) patch.rating = args.rating ?? undefined
    if (args.notes !== undefined) patch.notes = args.notes ?? undefined
    if (args.cover_url !== undefined) patch.coverUrl = args.cover_url ?? undefined
    if (args.read_date !== undefined) {
      patch.readDate =
        args.read_date != null && args.read_date !== ''
          ? Date.parse(args.read_date)
          : undefined
    }
    if (args.release_date !== undefined) {
      patch.releaseDate =
        args.release_date != null && args.release_date !== ''
          ? Date.parse(args.release_date)
          : undefined
    }
    await ctx.db.patch(existing._id, patch as typeof existing)
    const updated = await ctx.db.get(existing._id)
    if (!updated) throw new Error('Book not found after update')
    const summary = await getSeriesSummary(ctx, userId, updated.seriesLegacyId)
    return mapBook(updated, summary)
  },
})

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await requireUserSubject(ctx)
    const existing = await ctx.db
      .query('books')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', id),
      )
      .unique()
    if (!existing) throw new Error('Book not found')
    await ctx.db.delete(existing._id)
  },
})

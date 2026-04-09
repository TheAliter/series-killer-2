import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireUserSubject } from './lib/auth'

export const clearAllForUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserSubject(ctx)
    const books = await ctx.db
      .query('books')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const b of books) {
      await ctx.db.delete(b._id)
    }
    const series = await ctx.db
      .query('series')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const s of series) {
      await ctx.db.delete(s._id)
    }
    const authors = await ctx.db
      .query('authors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const a of authors) {
      await ctx.db.delete(a._id)
    }
  },
})

/** Dev / one-time migration: requires `MIGRATION_SECRET` in Convex env. */
export const importAuthorsBatch = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        name: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, { secret, userId, rows }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    for (const r of rows) {
      const existing = await ctx.db
        .query('authors')
        .withIndex('by_legacy', (q) => q.eq('legacyId', r.legacyId))
        .unique()
      if (existing) {
        await ctx.db.patch(existing._id, {
          userId,
          name: r.name,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
      } else {
        await ctx.db.insert('authors', {
          userId,
          legacyId: r.legacyId,
          name: r.name,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
      }
    }
  },
})

export const importSeriesBatch = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        totalBooks: v.number(),
        authorLegacyId: v.optional(v.string()),
        coverUrl: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, { secret, userId, rows }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    for (const r of rows) {
      const existing = await ctx.db
        .query('series')
        .withIndex('by_legacy', (q) => q.eq('legacyId', r.legacyId))
        .unique()
      const doc = {
        userId,
        legacyId: r.legacyId,
        name: r.name,
        description: r.description,
        totalBooks: r.totalBooks,
        authorLegacyId: r.authorLegacyId,
        coverUrl: r.coverUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
      if (existing) {
        await ctx.db.patch(existing._id, doc)
      } else {
        await ctx.db.insert('series', doc)
      }
    }
  },
})

export const importBooksBatch = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        title: v.string(),
        seriesLegacyId: v.optional(v.string()),
        seriesOrder: v.optional(v.number()),
        status: v.union(
          v.literal('reading'),
          v.literal('completed'),
          v.literal('want_to_read'),
          v.literal('dropped'),
        ),
        rating: v.optional(v.number()),
        notes: v.optional(v.string()),
        coverUrl: v.optional(v.string()),
        readDate: v.optional(v.number()),
        releaseDate: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, { secret, userId, rows }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    for (const r of rows) {
      const existing = await ctx.db
        .query('books')
        .withIndex('by_legacy', (q) => q.eq('legacyId', r.legacyId))
        .unique()
      const doc = {
        userId,
        legacyId: r.legacyId,
        title: r.title,
        seriesLegacyId: r.seriesLegacyId,
        seriesOrder: r.seriesOrder,
        status: r.status,
        rating: r.rating,
        notes: r.notes,
        coverUrl: r.coverUrl,
        readDate: r.readDate,
        releaseDate: r.releaseDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
      if (existing) {
        await ctx.db.patch(existing._id, doc)
      } else {
        await ctx.db.insert('books', doc)
      }
    }
  },
})

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUserSubject } from './lib/auth'
import { mapAuthor } from './lib/mappers'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserSubject(ctx)
    const rows = await ctx.db
      .query('authors')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    return rows.sort((a, b) => a.name.localeCompare(b.name)).map(mapAuthor)
  },
})

export const add = mutation({
  args: {
    name: v.string(),
    legacyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserSubject(ctx)
    const now = Date.now()
    const legacyId = args.legacyId ?? crypto.randomUUID()
    const existing = await ctx.db
      .query('authors')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', legacyId),
      )
      .unique()
    if (existing) {
      throw new Error('Author already exists')
    }
    await ctx.db.insert('authors', {
      userId,
      legacyId,
      name: args.name,
      createdAt: now,
      updatedAt: now,
    })
    const inserted = await ctx.db
      .query('authors')
      .withIndex('by_user_legacy', (q) =>
        q.eq('userId', userId).eq('legacyId', legacyId),
      )
      .unique()
    if (!inserted) throw new Error('Failed to load author')
    return mapAuthor(inserted)
  },
})

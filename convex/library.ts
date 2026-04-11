import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { components } from './_generated/api'
import { authComponent, createAuth } from './betterAuth/auth'
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
export const importAuthUsersBatch = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        sourceSupabaseUserId: v.string(),
        email: v.string(),
        name: v.string(),
        emailVerified: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  returns: v.object({
    createdCount: v.number(),
    existingCount: v.number(),
    mappings: v.array(
      v.object({
        sourceSupabaseUserId: v.string(),
        targetUserId: v.string(),
        email: v.string(),
      }),
    ),
  }),
  handler: async (ctx, { secret, rows }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    const auth = createAuth(ctx)
    const results: {
      sourceSupabaseUserId: string
      targetUserId: string
      email: string
      created: boolean
    }[] = []

    let createdCount = 0
    let existingCount = 0
    const now = Date.now()
    for (const row of rows) {
      const existingUser = await ctx.runQuery(
        components.betterAuth.migration.findUserForMigration,
        {
          sourceSupabaseUserId: row.sourceSupabaseUserId,
          email: row.email,
        },
      )

      let targetUserId: string
      let created = false
      if (existingUser) {
        targetUserId = String(existingUser.userId)
      } else {
        const signUpResult = (await auth.api.signUpEmail({
          body: {
            email: row.email,
            name: row.name,
            password: `${crypto.randomUUID()}-${crypto.randomUUID()}`,
          },
        })) as { user?: { id?: string } }
        const createdId = signUpResult.user?.id
        if (typeof createdId !== 'string' || createdId.length === 0) {
          throw new Error(`Failed to create Better Auth user for ${row.email}`)
        }
        targetUserId = createdId
        created = true
      }

      await ctx.runMutation(components.betterAuth.migration.patchMigratedUser, {
        userId: targetUserId,
        sourceSupabaseUserId: row.sourceSupabaseUserId,
        email: row.email,
        name: row.name,
        emailVerified: row.emailVerified,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })

      const result = {
        sourceSupabaseUserId: row.sourceSupabaseUserId,
        targetUserId,
        email: row.email,
        created,
      }
      results.push(result)

      if (result.created) {
        createdCount += 1
      } else {
        existingCount += 1
      }

      const existingMapping = await ctx.db
        .query('userMigrations')
        .withIndex('by_source_user', (query) =>
          query.eq('sourceSupabaseUserId', result.sourceSupabaseUserId),
        )
        .unique()

      const mappingDoc = {
        sourceSupabaseUserId: result.sourceSupabaseUserId,
        targetUserId: result.targetUserId,
        email: result.email,
        createdAt: existingMapping?.createdAt ?? now,
        updatedAt: now,
      }

      if (existingMapping) {
        await ctx.db.patch(existingMapping._id, mappingDoc)
      } else {
        await ctx.db.insert('userMigrations', mappingDoc)
      }
    }

    return {
      createdCount,
      existingCount,
      mappings: results.map((result) => ({
        sourceSupabaseUserId: result.sourceSupabaseUserId,
        targetUserId: result.targetUserId,
        email: result.email,
      })),
    }
  },
})

export const requestPasswordResetBatch = mutation({
  args: {
    secret: v.string(),
    emails: v.array(v.string()),
    redirectTo: v.optional(v.string()),
  },
  returns: v.object({
    requestedCount: v.number(),
  }),
  handler: async (ctx, { secret, emails, redirectTo }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    const auth = createAuth(ctx)
    let requestedCount = 0
    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase()
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo,
        },
      })
      requestedCount += 1
    }
    return { requestedCount }
  },
})

export const importAuthorsBatch = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        userId: v.string(),
        legacyId: v.string(),
        name: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  returns: v.object({
    insertedCount: v.number(),
    updatedCount: v.number(),
  }),
  handler: async (ctx, { secret, rows }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    let insertedCount = 0
    let updatedCount = 0
    for (const r of rows) {
      const existing = await ctx.db
        .query('authors')
        .withIndex('by_user_legacy', (q) =>
          q.eq('userId', r.userId).eq('legacyId', r.legacyId),
        )
        .unique()
      if (existing) {
        await ctx.db.patch(existing._id, {
          userId: r.userId,
          name: r.name,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
        updatedCount += 1
      } else {
        await ctx.db.insert('authors', {
          userId: r.userId,
          legacyId: r.legacyId,
          name: r.name,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
        insertedCount += 1
      }
    }
    return { insertedCount, updatedCount }
  },
})

export const importSeriesBatch = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        userId: v.string(),
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
  returns: v.object({
    insertedCount: v.number(),
    updatedCount: v.number(),
  }),
  handler: async (ctx, { secret, rows }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    let insertedCount = 0
    let updatedCount = 0
    for (const r of rows) {
      const existing = await ctx.db
        .query('series')
        .withIndex('by_user_legacy', (q) =>
          q.eq('userId', r.userId).eq('legacyId', r.legacyId),
        )
        .unique()
      const doc = {
        userId: r.userId,
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
        updatedCount += 1
      } else {
        await ctx.db.insert('series', doc)
        insertedCount += 1
      }
    }
    return { insertedCount, updatedCount }
  },
})

export const importBooksBatch = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        userId: v.string(),
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
  returns: v.object({
    insertedCount: v.number(),
    updatedCount: v.number(),
  }),
  handler: async (ctx, { secret, rows }) => {
    if (secret !== process.env.MIGRATION_SECRET) {
      throw new Error('Invalid migration secret')
    }
    let insertedCount = 0
    let updatedCount = 0
    for (const r of rows) {
      const existing = await ctx.db
        .query('books')
        .withIndex('by_user_legacy', (q) =>
          q.eq('userId', r.userId).eq('legacyId', r.legacyId),
        )
        .unique()
      const doc = {
        userId: r.userId,
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
        updatedCount += 1
      } else {
        await ctx.db.insert('books', doc)
        insertedCount += 1
      }
    }
    return { insertedCount, updatedCount }
  },
})

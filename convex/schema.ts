import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const bookStatus = v.union(
  v.literal('reading'),
  v.literal('completed'),
  v.literal('want_to_read'),
  v.literal('dropped'),
)

export default defineSchema({
  userMigrations: defineTable({
    sourceSupabaseUserId: v.string(),
    targetUserId: v.string(),
    email: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_source_user', ['sourceSupabaseUserId'])
    .index('by_target_user', ['targetUserId']),

  authors: defineTable({
    userId: v.string(),
    legacyId: v.string(),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_legacy', ['legacyId'])
    .index('by_user_legacy', ['userId', 'legacyId']),

  series: defineTable({
    userId: v.string(),
    legacyId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    totalBooks: v.number(),
    authorLegacyId: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_legacy', ['legacyId'])
    .index('by_user_legacy', ['userId', 'legacyId']),

  books: defineTable({
    userId: v.string(),
    legacyId: v.string(),
    title: v.string(),
    seriesLegacyId: v.optional(v.string()),
    seriesOrder: v.optional(v.number()),
    status: bookStatus,
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    readDate: v.optional(v.number()),
    releaseDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_legacy', ['legacyId'])
    .index('by_user_legacy', ['userId', 'legacyId'])
    .index('by_series_legacy', ['seriesLegacyId']),
})

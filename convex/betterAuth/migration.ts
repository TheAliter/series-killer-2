import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export const findUserForMigration = query({
  args: {
    sourceSupabaseUserId: v.string(),
    email: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.id('user'),
      email: v.string(),
    }),
  ),
  handler: async (ctx, { sourceSupabaseUserId, email }) => {
    const normalizedEmail = normalizeEmail(email)
    const existingBySource = await ctx.db
      .query('user')
      .withIndex('userId', (query) => query.eq('userId', sourceSupabaseUserId))
      .first()
    if (existingBySource) {
      return {
        userId: existingBySource._id,
        email: existingBySource.email,
      }
    }

    const existingByEmail = await ctx.db
      .query('user')
      .withIndex('email', (query) => query.eq('email', normalizedEmail))
      .first()
    if (existingByEmail) {
      return {
        userId: existingByEmail._id,
        email: existingByEmail.email,
      }
    }

    return null
  },
})

export const patchMigratedUser = mutation({
  args: {
    userId: v.id('user'),
    sourceSupabaseUserId: v.string(),
    email: v.string(),
    name: v.string(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  returns: v.object({ patched: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as Id<'user'>)
    if (!user) {
      throw new Error(`User not found: ${args.userId}`)
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      email: normalizeEmail(args.email),
      emailVerified: args.emailVerified,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      userId: args.sourceSupabaseUserId,
    })

    return { patched: true }
  },
})

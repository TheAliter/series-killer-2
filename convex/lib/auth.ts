import { ConvexError } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export async function requireUserSubject(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity?.subject) {
    throw new ConvexError('Unauthorized')
  }
  return identity.subject
}

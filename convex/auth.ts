import { query } from './_generated/server'
import { authComponent } from './betterAuth/auth'

export const { getAuthUser } = authComponent.clientApi()

export const getAuthUserOrNull = query({
  args: {},
  handler: async (ctx) => {
    return (await authComponent.safeGetAuthUser(ctx)) ?? null
  },
})

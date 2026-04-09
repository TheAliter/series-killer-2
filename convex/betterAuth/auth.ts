import { createClient } from '@convex-dev/better-auth'
import { convex, crossDomain } from '@convex-dev/better-auth/plugins'
import type { GenericCtx } from '@convex-dev/better-auth/utils'
import type { BetterAuthOptions } from 'better-auth'
import { betterAuth } from 'better-auth'
import { components } from '../_generated/api'
import type { DataModel } from '../_generated/dataModel'
import authConfig from '../auth.config'
import schema from './schema'

export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  },
)

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = trimTrailingSlash(process.env.SITE_URL ?? 'http://localhost:3000')
  const convexSiteUrl = trimTrailingSlash(process.env.CONVEX_SITE_URL ?? '')
  /** Public URL where `/api/auth/*` is served (Convex `.site` in production). */
  const authPublicBase =
    convexSiteUrl.length > 0
      ? `${convexSiteUrl}/api/auth`
      : `${siteUrl}/api/auth`
  return {
    appName: 'Series Killer',
    baseURL: authPublicBase,
    basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET!,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        console.info('[auth] Password reset link for', user.email, url)
      },
    },
    advanced: {
      cookiePrefix: 'series_killer',
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
    trustedOrigins: [siteUrl, convexSiteUrl].filter(Boolean),
    plugins: [
      convex({
        authConfig,
        jwks: process.env.JWKS,
        options: {
          basePath: '/api/auth',
        },
      }),
      crossDomain({ siteUrl }),
    ],
  } satisfies BetterAuthOptions
}

export const options = createAuthOptions({} as GenericCtx<DataModel>)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx))
}

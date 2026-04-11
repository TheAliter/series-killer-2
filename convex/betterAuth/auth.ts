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

async function sendPasswordResetEmailWithResend({
  to,
  resetUrl,
}: {
  to: string
  resetUrl: string
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const sender = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [to],
      subject: 'Reset your Series Killer password',
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      text: `You requested a password reset.\n\nReset your password: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    }),
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Resend request failed (${response.status}): ${responseText}`)
  }
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = trimTrailingSlash(process.env.SITE_URL ?? 'http://localhost:3000')
  const convexSiteUrl = trimTrailingSlash(process.env.CONVEX_SITE_URL ?? '')
  const localDevOrigins = ['http://localhost:3000', 'http://localhost:3001']
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
        try {
          await sendPasswordResetEmailWithResend({
            to: user.email,
            resetUrl: url,
          })
        } catch (error) {
          console.error('[auth] Failed to send password reset email', {
            email: user.email,
            error,
          })
          throw error
        }
      },
    },
    advanced: {
      cookiePrefix: 'series_killer',
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
    trustedOrigins: [siteUrl, convexSiteUrl, ...localDevOrigins].filter(Boolean),
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

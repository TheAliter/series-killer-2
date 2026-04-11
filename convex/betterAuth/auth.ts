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

function parseTrustedOrigins(value: string | undefined): string[] {
  if (!value) {
    return []
  }
  return value
    .split(',')
    .map((origin) => trimTrailingSlash(origin.trim()))
    .filter((origin) => origin.length > 0)
}

function normalizeStaticJwks(rawValue: string | undefined): string | undefined {
  if (!rawValue) {
    return undefined
  }
  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed)
    }
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'keys' in parsed &&
      Array.isArray((parsed as { keys?: unknown }).keys)
    ) {
      return JSON.stringify((parsed as { keys: unknown[] }).keys)
    }
    console.warn(
      '[auth] JWKS env value must be an array or an object with a keys array. Falling back to dynamic JWKS endpoint.',
    )
    return undefined
  } catch {
    console.warn(
      '[auth] JWKS env value is not valid JSON. Falling back to dynamic JWKS endpoint.',
    )
    return undefined
  }
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
    console.warn(
      '[auth] RESEND_API_KEY is not configured; password reset link is not emailed.',
      {
        email: to,
        resetUrl,
      },
    )
    return
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
    let parsedMessage = responseText
    try {
      const parsed = JSON.parse(responseText) as { message?: string; error?: string }
      parsedMessage = parsed.message ?? parsed.error ?? responseText
    } catch {
      // Keep raw text when the response is not JSON.
    }

    const isSandboxRecipientRestriction =
      response.status === 403 &&
      parsedMessage.toLowerCase().includes('testing emails to your own email address')

    if (isSandboxRecipientRestriction) {
      throw new Error(
        'Resend rejected this recipient in test mode. Set RESEND_FROM to a verified sender/domain, or use a verified recipient while testing.',
      )
    }

    throw new Error(`Resend request failed (${response.status}): ${parsedMessage}`)
  }
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = trimTrailingSlash(process.env.SITE_URL ?? 'http://localhost:3000')
  const convexSiteUrl = trimTrailingSlash(process.env.CONVEX_SITE_URL ?? '')
  const localDevOrigins = ['http://localhost:3000', 'http://localhost:3001']
  const additionalTrustedOrigins = parseTrustedOrigins(
    process.env.BETTER_AUTH_TRUSTED_ORIGINS,
  )
  const trustedOrigins = Array.from(
    new Set([siteUrl, convexSiteUrl, ...localDevOrigins, ...additionalTrustedOrigins].filter(Boolean)),
  )
  const staticJwks = normalizeStaticJwks(process.env.JWKS)
  /** Public app URL where Nuxt proxies `/api/auth/*` in SSR mode. */
  const authPublicBase = `${siteUrl}/api/auth`
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
    trustedOrigins,
    plugins: [
      convex({
        authConfig,
        jwks: staticJwks,
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

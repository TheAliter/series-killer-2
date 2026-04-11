import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config'
import type { AuthConfig } from 'convex/server'

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

const staticJwks = normalizeStaticJwks(process.env.JWKS)

export default {
  providers: [
    getAuthConfigProvider({
      jwks: staticJwks,
    }),
  ],
} satisfies AuthConfig

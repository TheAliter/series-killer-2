import type { ConvexClient } from 'convex/browser'
import type { Atom } from 'nanostores'

type AuthSessionAtomValue = {
  data: { user: { id: string; email: string }; session: { id: string } } | null
  error: unknown
  isPending: boolean
}

declare module '#app' {
  interface NuxtApp {
    $convex: ConvexClient
    /** Better Auth client + Convex plugin (typed loosely to avoid version coupling). */
    $authClient: {
      useSession: Atom<AuthSessionAtomValue>
      signIn: { email: (args: { email: string; password: string }) => Promise<unknown> }
      signUp: { email: (args: { email: string; password: string; name: string }) => Promise<unknown> }
      signOut: (args?: object) => Promise<unknown>
      getSession: () => Promise<unknown>
      requestPasswordReset: (args: { email: string; redirectTo?: string }) => Promise<unknown>
      resetPassword: (args: { newPassword: string; token: string }) => Promise<unknown>
      changePassword: (args: {
        currentPassword: string
        newPassword: string
        revokeOtherSessions?: boolean
      }) => Promise<unknown>
      convex: {
        token: (args?: { fetchOptions?: { throw?: boolean } }) => Promise<{ data?: { token?: string } }>
      }
    }
  }
}

export {}

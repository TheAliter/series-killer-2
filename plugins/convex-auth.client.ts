import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/client'
import { ConvexClient } from 'convex/browser'
import { useStore } from '@nanostores/vue'
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const convexUrl = String(config.public.convexUrl ?? '').trim()
  const convexSiteUrl = String(config.public.convexSiteUrl ?? '')
  const siteUrl = String(config.public.siteUrl ?? '').replace(/\/$/, '')
  const authBaseUrl =
    convexSiteUrl || convexUrl || siteUrl || 'https://convex-auth-not-configured.invalid'
  const convexUrlConfigured = convexUrl.length > 0
  const skipUrlCheck =
    !convexUrlConfigured ||
    convexUrl.includes('placeholder') ||
    convexUrl.includes('localhost')

  // A real deployment URL is required to open a sync connection; a fake host like
  // placeholder.convex.cloud throws "[CONVEX FATAL ERROR] Couldn't parse deployment name".
  const convex = new ConvexClient(
    convexUrlConfigured ? convexUrl : 'https://convex-not-configured.invalid',
    {
      disabled: !convexUrlConfigured,
      skipConvexDeploymentUrlCheck: skipUrlCheck,
    },
  )

  const authClient = createAuthClient({
    baseURL: authBaseUrl,
    plugins: [crossDomainClient(), convexClient()],
  })

  const session = useStore(authClient.useSession)

  watch(
    () => session.value,
    (value) => {
      if (value.data?.session) {
        convex.setAuth(async () => {
          const result = await authClient.convex.token({
            fetchOptions: { throw: false },
          })
          return result.data?.token ?? null
        })
      } else {
        convex.setAuth(async () => null)
      }
    },
    { deep: true, immediate: true },
  )

  return {
    provide: {
      convex,
      authClient,
    },
  }
})

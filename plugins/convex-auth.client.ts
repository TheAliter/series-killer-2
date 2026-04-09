import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/client'
import { ConvexClient } from 'convex/browser'
import { useStore } from '@nanostores/vue'
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const convexUrl = String(config.public.convexUrl ?? '')
  const convexSiteUrl = String(config.public.convexSiteUrl ?? '')
  const siteUrl = String(config.public.siteUrl ?? '').replace(/\/$/, '')
  const authBaseUrl =
    convexSiteUrl || convexUrl || siteUrl || 'https://convex-auth-not-configured.invalid'
  const skipUrlCheck =
    !convexUrl ||
    convexUrl.includes('placeholder') ||
    convexUrl.includes('localhost')

  const convex = new ConvexClient(convexUrl || 'https://placeholder.convex.cloud', {
    skipConvexDeploymentUrlCheck: skipUrlCheck,
  })

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

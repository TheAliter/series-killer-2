export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const { $authClient } = useNuxtApp()
  const session = await $authClient
    .getSession()
    .catch(() => ({ data: { session: null as unknown } }))
  const data = session as { data?: { session?: unknown } }
  if (data?.data?.session) {
    return navigateTo('/')
  }
})

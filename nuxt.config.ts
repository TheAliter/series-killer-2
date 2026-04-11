// https://nuxt.com/docs/api/configuration/nuxt-config
// Tailwind v4 is integrated by @nuxt/ui (not @nuxtjs/tailwindcss, which targets Tailwind 3).
export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',
  modules: ['@nuxt/ui', 'better-convex-nuxt'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: {
    preset: 'cloudflare_pages',
  },
  convex: {
    url: process.env.CONVEX_URL || process.env.NUXT_PUBLIC_CONVEX_URL || '',
    siteUrl: process.env.CONVEX_SITE_URL || process.env.NUXT_PUBLIC_CONVEX_SITE_URL || undefined,
    auth: {
      routeProtection: {
        redirectTo: '/login',
      },
      unauthorized: {
        redirectTo: '/login',
      },
    },
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000',
    },
  },
})

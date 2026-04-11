// https://nuxt.com/docs/api/configuration/nuxt-config
// Tailwind v4 is integrated by @nuxt/ui (not @nuxtjs/tailwindcss, which targets Tailwind 3).
export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: {
    preset: 'cloudflare_pages',
  },
  /** Library routes use client-only auth middleware; SSR + redirect caused hydration/layout mismatches. */
  routeRules: {
    '/': { ssr: false },
    '/book/**': { ssr: false },
    '/series/**': { ssr: false },
    '/account/**': { ssr: false },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'better-auth/client',
        'convex/browser',
        '@convex-dev/better-auth/client/plugins',
        '@nanostores/vue',
      ],
    },
  },
  runtimeConfig: {
    public: {
      convexUrl: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || '',
      convexSiteUrl: process.env.NUXT_PUBLIC_CONVEX_SITE_URL || process.env.CONVEX_SITE_URL || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000',
    },
  },
})

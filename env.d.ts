/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    convexUrl: string
    convexSiteUrl: string
    siteUrl: string
  }
}

export {}

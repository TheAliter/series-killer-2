import { RuntimeConfig as UserRuntimeConfig, PublicRuntimeConfig as UserPublicRuntimeConfig } from 'nuxt/schema'
  interface SharedRuntimeConfig {
   app: {
      buildId: string,

      baseURL: string,

      buildAssetsDir: string,

      cdnURL: string,
   },

   nitro: {
      envPrefix: string,
   },

   icon: {
      serverKnownCssClasses: Array<any>,
   },
  }
  interface SharedPublicRuntimeConfig {
   siteUrl: string,

   convex: {
      url: string,

      siteUrl: string,

      auth: {
         enabled: boolean,

         routeProtection: {
            redirectTo: string,

            preserveReturnTo: boolean,
         },

         unauthorized: {
            enabled: boolean,

            redirectTo: string,

            includeQueries: boolean,
         },
      },

      authRoute: string,

      trustedOrigins: Array<any>,

      skipAuthRoutes: Array<any>,

      permissions: boolean,

      logging: boolean,

      debug: {
         authFlow: boolean,

         clientAuthFlow: boolean,

         serverAuthFlow: boolean,
      },

      authCache: {
         enabled: boolean,

         ttl: number,
      },

      defaults: {
         server: boolean,

         subscribe: boolean,

         auth: string,
      },

      upload: {
         maxConcurrent: number,
      },

      authProxy: {
         maxRequestBodyBytes: number,

         maxResponseBodyBytes: number,
      },
   },
  }
declare module '@nuxt/schema' {
  interface RuntimeConfig extends UserRuntimeConfig {}
  interface PublicRuntimeConfig extends UserPublicRuntimeConfig {}
}
declare module 'nuxt/schema' {
  interface RuntimeConfig extends SharedRuntimeConfig {}
  interface PublicRuntimeConfig extends SharedPublicRuntimeConfig {}
}
declare module 'vue' {
        interface ComponentCustomProperties {
          $config: UserRuntimeConfig
        }
      }
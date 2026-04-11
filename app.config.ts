export default defineAppConfig({
  icon: {
    /** Avoid Nitro 500 when Iconify API is unreachable (offline / firewall). */
    fallbackToApi: false,
  },
})

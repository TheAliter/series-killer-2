# Deployment: Convex, Better Auth, and Cloudflare Pages

This app is a **Nuxt 4** app with **better-convex-nuxt** (SSR auth proxy + Convex client), **Convex** (data + Better Auth HTTP routes), and **Cloudflare Pages** (`nitro.preset: cloudflare_pages`).

## Architecture (short)

- **Frontend:** Cloudflare Pages serves the Nuxt build. Users’ origin must match Convex `SITE_URL`.
- **Auth HTTP:** Better Auth runs on Convex; Nuxt proxies app-origin `/api/auth/*` to Convex in SSR mode.
- **Convex sync:** Realtime queries/mutations use `https://<deployment>.convex.cloud`.

## 1. Convex: link, env, deploy

1. Install dependencies and start the Convex dev loop (keep it running while developing):
  ```bash
   npm install
   npx convex dev
  ```
   Follow the CLI to log in, create or select a project, and link this repo. That updates local Convex config and generated types.
2. Set **deployment environment variables** (Convex Dashboard → your deployment → Settings → Environment Variables, or `npx convex env set`):

  | Variable             | Purpose                                                                                                                                                                                                              |
  | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `BETTER_AUTH_SECRET` | Long random secret for Better Auth. Example: `npx convex env set BETTER_AUTH_SECRET "paste-a-long-random-string"`                                                                                                    |
  | `SITE_URL`           | Exact origin users use: `http://localhost:3000` for local dev, or `https://your-app.pages.dev` (or custom domain) in production.                                                                                     |
  | `CONVEX_SITE_URL`    | *Optional.* Custom Convex HTTP Actions domain override. Usually not needed with default `.site` derivation.                                                                                                            |
  | `BETTER_AUTH_TRUSTED_ORIGINS` | *Optional.* Comma-separated extra origins to allow for Better Auth CORS/trusted origins (for example both Pages URL and custom domain).                                                                 |
  | `JWKS`               | *Optional.* If unset, `convex/auth.config.ts` uses an empty provider config (same idea as [Convex + Better Auth](https://labs.convex.dev/better-auth)). Set only if you follow docs that require a JWKS JSON string. |
  | `MIGRATION_SECRET`   | *Optional.* Only for `scripts/migrate-from-supabase.mjs`.                                                                                                                                                            |

3. Deploy Convex functions to production when ready:
  ```bash
   npm run convex:deploy
  ```
   Use the **production** deployment URLs for Cloudflare env vars below.

## 1.1 Supabase -> Convex one-time migration

1. Ensure `MIGRATION_SECRET` is set on Convex deployment env.
2. Export local shell env before running migration:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CONVEX_URL`
   - `MIGRATION_SECRET`
3. Optional migration env:
   - `SOURCE_SUPABASE_USER_ID` (single-user scoped run)
   - `MIGRATION_DRY_RUN=true` (validation only)
   - `MIGRATION_SKIP_PASSWORD_RESET=true` (skip reset requests)
   - `MIGRATION_RESET_REDIRECT_TO=https://your-app/reset-password`
4. Run migration:
   ```bash
   npm run migrate:supabase
   ```
5. Verify migration summary output:
   - `unresolvedOwnerCount` = `0`
   - `unresolvedAuthorReferenceCount` = `0`
   - `unresolvedSeriesReferenceCount` = `0`
6. Rerun behavior is idempotent for auth/data upserts keyed by source user and per-user legacy IDs.
7. If password reset is enabled, reset requests are generated for imported users. By default this repo logs reset links from `sendResetPassword`.

## 2. Local Nuxt + Convex

1. Copy `[env.local.example](env.local.example)` to `.env.local` and fill in at least `CONVEX_URL` (optionally `CONVEX_SITE_URL` and `NUXT_PUBLIC_SITE_URL`).
2. Run two terminals:
  - `npx convex dev`
  - `npm run dev`
3. **Password reset:** `sendResetPassword` in `convex/betterAuth/auth.ts` only logs the link to the Convex dashboard logs. Wire a real email provider when you need production password reset.

## 3. Cloudflare Pages

1. Connect the Git repository and create a Pages project.
2. **Build configuration**
  - Build command: `npm run build`
  - Build output directory: `**dist`**  
  (Confirmed for Nuxt 4.4 + Nitro `cloudflare-pages`: Nitro prints `Generated public dist` and `wrangler pages deploy dist`.)
3. **Environment variables** (Pages → Settings → Environment variables), for **Production** (and Preview if you use previews):
  - `CONVEX_URL` = `https://<deployment>.convex.cloud`
  - `CONVEX_SITE_URL` = optional custom HTTP Actions host (only if not using default)
  - `NUXT_PUBLIC_SITE_URL` = your real site origin (optional helper value for frontend UX flows)
4. After the first production URL is known, set Convex `**SITE_URL`** to that same origin and redeploy Convex if needed so `trustedOrigins` and cross-domain auth stay aligned.
5. Optional local preview of the Pages bundle:
  ```bash
   npm run build
   npx wrangler pages dev dist
  ```

## 4. Troubleshooting


| Symptom                             | What to check                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Sign-in network / “could not reach” | `CONVEX_URL`, Convex deploy, and that HTTP routes are deployed (`convex/http.ts`). |
| Convex `Unauthorized` on data       | Confirm `useConvexAuth()` reports authenticated session and Convex auth config matches Better Auth setup. |
| CORS or cookies                     | `SITE_URL` on Convex must match the real app origin; set `BETTER_AUTH_TRUSTED_ORIGINS` for additional domains. |


## 5. Maintaining Better Auth schema

When you change Better Auth options in `convex/betterAuth/auth.ts`, regenerate the component schema:

```bash
npm run convex:auth-schema
```

## Further reference

- [Convex + Better Auth (labs)](https://labs.convex.dev/better-auth)
- [Better Auth Convex integration](https://www.better-auth.com/docs/integrations/convex)
- [Convex docs](https://docs.convex.dev/home)


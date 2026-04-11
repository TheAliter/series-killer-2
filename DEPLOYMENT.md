# Deployment: Convex, Better Auth, and Cloudflare Pages

This app is a **Nuxt 4** SPA-oriented client with **Convex** (data + Better Auth HTTP routes on `.site`) and **Cloudflare Pages** (`nitro.preset: cloudflare_pages`). Ignore any older copies of this file that mentioned Supabase or Vite.

## Architecture (short)

- **Frontend:** Cloudflare Pages serves the Nuxt build. Users’ origin must match `NUXT_PUBLIC_SITE_URL` and Convex `SITE_URL`.
- **Auth HTTP:** Better Auth runs on Convex; the browser calls `https://<deployment>.convex.site/api/auth/`*.
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
  | `CONVEX_SITE_URL`    | `https://<your-deployment>.convex.site` — used as the public Better Auth base (`…/api/auth`).                                                                                                                        |
  | `JWKS`               | *Optional.* If unset, `convex/auth.config.ts` uses an empty provider config (same idea as [Convex + Better Auth](https://labs.convex.dev/better-auth)). Set only if you follow docs that require a JWKS JSON string. |
  | `MIGRATION_SECRET`   | *Optional.* Only for `scripts/migrate-from-supabase.mjs`.                                                                                                                                                            |

3. Deploy Convex functions to production when ready:
  ```bash
   npm run convex:deploy
  ```
   Use the **production** deployment URLs for Cloudflare env vars below.

## 2. Local Nuxt + Convex

1. Copy `[env.local.example](env.local.example)` to `.env.local` and fill in `NUXT_PUBLIC_CONVEX_URL`, `NUXT_PUBLIC_CONVEX_SITE_URL`, and `NUXT_PUBLIC_SITE_URL`.
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
  - `NUXT_PUBLIC_CONVEX_URL` = `https://<deployment>.convex.cloud`
  - `NUXT_PUBLIC_CONVEX_SITE_URL` = `https://<deployment>.convex.site`
  - `NUXT_PUBLIC_SITE_URL` = your real site origin (e.g. `https://<project>.pages.dev` or custom domain)
4. After the first production URL is known, set Convex `**SITE_URL`** to that same origin and redeploy Convex if needed so `trustedOrigins` and cross-domain auth stay aligned.
5. Optional local preview of the Pages bundle:
  ```bash
   npm run build
   npx wrangler pages dev dist
  ```

## 4. Troubleshooting


| Symptom                             | What to check                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Sign-in network / “could not reach” | `NUXT_PUBLIC_CONVEX_SITE_URL`, Convex deploy, and that HTTP routes are deployed (`convex/http.ts`).          |
| Convex `Unauthorized` on data       | Session token / `convex.setAuth` in `plugins/convex-auth.client.ts`; Convex auth config.                     |
| CORS or cookies                     | `SITE_URL` and `CONVEX_SITE_URL` on Convex match real origins; `NUXT_PUBLIC_SITE_URL` matches the Pages URL. |


## 5. Maintaining Better Auth schema

When you change Better Auth options in `convex/betterAuth/auth.ts`, regenerate the component schema:

```bash
npm run convex:auth-schema
```

## Further reference

- [Convex + Better Auth (labs)](https://labs.convex.dev/better-auth)
- [Better Auth Convex integration](https://www.better-auth.com/docs/integrations/convex)
- [Convex docs](https://docs.convex.dev/home)


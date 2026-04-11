# Series Killer

Track book series and reading progress. **Nuxt 4**, **Convex**, **Better Auth** (email/password), **Nuxt UI**, and **Cloudflare Pages**.

## Features

- Series and books CRUD with reading status, ratings, notes, and release dates
- Open Library search when adding books
- Email/password sign-up and sign-in (Better Auth on Convex)
- Per-user data enforced in Convex with `ctx.auth`

## Tech stack

| Layer | Choice |
|-------|--------|
| App | Nuxt 4, Vue 3, TypeScript, Nuxt UI, Tailwind CSS 4 |
| Backend | Convex (queries, mutations, HTTP routes for `/api/auth`) |
| Auth | `better-auth` + `@convex-dev/better-auth` (cross-domain + Convex plugins) |
| Hosting | Cloudflare Pages (`nitro.preset: cloudflare_pages`, build output **`dist`**) |

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- A [Convex](https://www.convex.dev/) account
- For production: a [Cloudflare](https://www.cloudflare.com/) account (Pages)

## Quick start

1. **Clone and install**

   ```bash
   git clone <your-repo-url> series-killer
   cd series-killer
   npm install
   ```

2. **Convex**

   ```bash
   npx convex dev
   ```

   Log in, link or create a project, and leave this running during development.

3. **Environment**

   Copy [`env.local.example`](env.local.example) to `.env.local` and set:

   - `NUXT_PUBLIC_CONVEX_URL` — `https://<deployment>.convex.cloud`
   - `NUXT_PUBLIC_CONVEX_SITE_URL` — `https://<deployment>.convex.site`
   - `NUXT_PUBLIC_SITE_URL` — `http://localhost:3000` for local dev

   On the **Convex** deployment (dashboard or `npx convex env set`), set at least:

   - `BETTER_AUTH_SECRET`
   - `SITE_URL` (same origin as above, e.g. `http://localhost:3000`)
   - `CONVEX_SITE_URL` (your `https://…convex.site`)
   - `RESEND_API_KEY` (for password reset email delivery)
   - `RESEND_FROM` (optional; defaults to `onboarding@resend.dev`)

   See [`env.example`](env.example) for a full checklist.

4. **Run Nuxt** (second terminal)

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`, sign up, then use the library UI.

## Password reset email (Resend)

1. Set Convex env vars:
   - `RESEND_API_KEY=re_xxxxxxxxx`
   - `RESEND_FROM=onboarding@resend.dev` (optional)
2. Submit an email in `forgot-password`.
3. Verify the request succeeds and the reset email arrives in the target inbox.
4. If delivery fails, check Convex logs for the surfaced Resend API error details.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Nuxt dev server |
| `npm run build` | Production build (Cloudflare Pages bundle in `dist/`) |
| `npm run preview` | Preview Nuxt production build locally |
| `npm run typecheck` | Nuxt TypeScript check |
| `npm run convex:dev` | Convex dev (same as `npx convex dev`) |
| `npm run convex:deploy` | Deploy Convex functions |
| `npm run migrate:supabase` | Optional one-off migration from Supabase (needs env vars) |

## One-time Supabase -> Convex migration

1. Set migration env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CONVEX_URL`, `MIGRATION_SECRET`).
2. Optionally set:
   - `SOURCE_SUPABASE_USER_ID` to migrate one user only.
   - `MIGRATION_DRY_RUN=true` for validation without writes.
   - `MIGRATION_SKIP_PASSWORD_RESET=true` to skip reset requests.
   - `MIGRATION_RESET_REDIRECT_TO` to override reset URL.
3. Run:
   ```bash
   npm run migrate:supabase
   ```
4. Validate the printed migration summary:
   - `unresolvedOwnerCount` should be `0` (for each table).
   - `unresolvedAuthorReferenceCount` and `unresolvedSeriesReferenceCount` should be `0`.
   - `duplicateLegacyCount` should be `0` for clean reruns.
5. If not skipped, reset requests are issued for imported emails using the Resend-backed `sendResetPassword` handler in `convex/betterAuth/auth.ts`.

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for Convex env vars, Cloudflare Pages settings, and troubleshooting.

## License

MIT — see [LICENSE](LICENSE) if present.

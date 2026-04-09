/**
 * Read-only Supabase (PostgREST) export → Convex `library.import*Batch` mutations.
 *
 * Env:
 *   SUPABASE_URL              — https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service role (read-only use: SELECT only)
 *   CONVEX_URL                — https://xxx.convex.cloud
 *   MIGRATION_SECRET          — same as Convex env MIGRATION_SECRET
 *   SOURCE_SUPABASE_USER_ID   — auth.users.id / profiles.user_id to filter rows
 *   TARGET_CONVEX_USER_ID     — Better Auth `userId` / subject string in Convex
 *
 * Does not import auth users or password hashes; run a separate Better Auth / admin flow for that.
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'

const BATCH = 80

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

function toMillis(isoOrNull) {
  if (!isoOrNull) return Date.now()
  const t = Date.parse(isoOrNull)
  return Number.isFinite(t) ? t : Date.now()
}

async function fetchAllRows({ baseUrl, key, table, userIdColumn, userId }) {
  const rows = []
  const pageSize = 1000
  let offset = 0
  for (;;) {
    const url = new URL(`${baseUrl}/rest/v1/${table}`)
    url.searchParams.set('select', '*')
    url.searchParams.set(userIdColumn, `eq.${userId}`)
    url.searchParams.set('order', 'created_at.asc')
    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${offset}-${offset + pageSize - 1}`,
        Prefer: 'count=exact',
      },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Supabase ${table} ${res.status}: ${text}`)
    }
    const chunk = await res.json()
    if (!Array.isArray(chunk) || chunk.length === 0) break
    rows.push(...chunk)
    if (chunk.length < pageSize) break
    offset += pageSize
  }
  return rows
}

async function main() {
  const baseUrl = requireEnv('SUPABASE_URL').replace(/\/$/, '')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const convexUrl = requireEnv('CONVEX_URL')
  const secret = requireEnv('MIGRATION_SECRET')
  const sourceUserId = requireEnv('SOURCE_SUPABASE_USER_ID')
  const targetUserId = requireEnv('TARGET_CONVEX_USER_ID')

  const client = new ConvexHttpClient(convexUrl)

  console.info('Fetching authors…')
  const authors = await fetchAllRows({
    baseUrl,
    key,
    table: 'authors',
    userIdColumn: 'user_id',
    userId: sourceUserId,
  })
  for (let i = 0; i < authors.length; i += BATCH) {
    const slice = authors.slice(i, i + BATCH)
    await client.mutation(api.library.importAuthorsBatch, {
      secret,
      userId: targetUserId,
      rows: slice.map((a) => ({
        legacyId: a.id,
        name: a.name,
        createdAt: toMillis(a.created_at),
        updatedAt: toMillis(a.updated_at),
      })),
    })
    process.stdout.write('.')
  }
  process.stdout.write('\n')

  console.info('Fetching series…')
  const series = await fetchAllRows({
    baseUrl,
    key,
    table: 'series',
    userIdColumn: 'user_id',
    userId: sourceUserId,
  })
  const seriesPayloads = series.map((s) => ({
    legacyId: s.id,
    name: s.name,
    description: s.description ?? undefined,
    totalBooks: s.total_books ?? 0,
    authorLegacyId: s.author_id ?? undefined,
    coverUrl: s.cover_url ?? undefined,
    createdAt: toMillis(s.created_at),
    updatedAt: toMillis(s.updated_at),
  }))
  for (let i = 0; i < seriesPayloads.length; i += BATCH) {
    const rows = seriesPayloads.slice(i, i + BATCH)
    await client.mutation(api.library.importSeriesBatch, {
      secret,
      userId: targetUserId,
      rows,
    })
    process.stdout.write('.')
  }
  process.stdout.write('\n')

  console.info('Fetching books…')
  const books = await fetchAllRows({
    baseUrl,
    key,
    table: 'books',
    userIdColumn: 'user_id',
    userId: sourceUserId,
  })
  const bookPayloads = books.map((b) => ({
    legacyId: b.id,
    title: b.title,
    seriesLegacyId: b.series_id ?? undefined,
    seriesOrder: b.series_order ?? undefined,
    status: b.status,
    rating: b.rating ?? undefined,
    notes: b.notes ?? undefined,
    coverUrl: b.cover_url ?? undefined,
    readDate: b.read_date ? toMillis(b.read_date) : undefined,
    releaseDate: b.release_date ? toMillis(b.release_date) : undefined,
    createdAt: toMillis(b.created_at),
    updatedAt: toMillis(b.updated_at),
  }))
  for (let i = 0; i < bookPayloads.length; i += BATCH) {
    const rows = bookPayloads.slice(i, i + BATCH)
    await client.mutation(api.library.importBooksBatch, {
      secret,
      userId: targetUserId,
      rows,
    })
    process.stdout.write('.')
  }
  process.stdout.write('\n')

  console.info('Done. Reconcile series totals in app or run sync if needed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

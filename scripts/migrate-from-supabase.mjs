/**
 * Supabase export -> Convex migration (all app data + auth identities).
 *
 * Env:
 *   SUPABASE_URL                 https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    Supabase service role key
 *   CONVEX_URL                   https://xxx.convex.cloud
 *   MIGRATION_SECRET             Convex MIGRATION_SECRET value
 *
 * Optional:
 *   SOURCE_SUPABASE_USER_ID      filter to one source user ID
 *   MIGRATION_DRY_RUN            true|false (default false)
 *   MIGRATION_SKIP_PASSWORD_RESET true|false (default false)
 *   MIGRATION_RESET_REDIRECT_TO  explicit password reset redirect URL
 *   SITE_URL                     fallback for reset redirect URL
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'

const BATCH_SIZE = 80
const AUTH_BATCH_SIZE = 1
const SUPABASE_PAGE_SIZE = 1000
const SUPABASE_AUTH_PAGE_SIZE = 200

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

function optionalEnv(name) {
  const value = process.env[name]
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseBooleanEnv(name) {
  const value = optionalEnv(name)
  if (!value) return false
  return value.toLowerCase() === 'true'
}

function toMillis(timestamp) {
  if (!timestamp) return Date.now()
  const parsed = Date.parse(String(timestamp))
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase()
}

function normalizeName(user) {
  const metadata =
    user && typeof user.user_metadata === 'object' && user.user_metadata !== null
      ? user.user_metadata
      : {}
  const preferredName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : null
  if (preferredName && preferredName.trim().length > 0) {
    return preferredName.trim()
  }
  const email = normalizeEmail(user.email ?? '')
  if (email.includes('@')) {
    const [localPart] = email.split('@')
    if (localPart.length > 0) return localPart
  }
  return `user-${user.id}`
}

async function fetchSupabaseTableRows({ baseUrl, key, table, userFilter }) {
  const rows = []
  let offset = 0

  for (;;) {
    const url = new URL(`${baseUrl}/rest/v1/${table}`)
    url.searchParams.set('select', '*')
    if (userFilter) {
      url.searchParams.set('user_id', `eq.${userFilter}`)
    }
    url.searchParams.set('order', 'created_at.asc')

    const response = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${offset}-${offset + SUPABASE_PAGE_SIZE - 1}`,
        Prefer: 'count=exact',
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Supabase table ${table} ${response.status}: ${text}`)
    }

    const chunk = await response.json()
    if (!Array.isArray(chunk) || chunk.length === 0) break
    rows.push(...chunk)
    if (chunk.length < SUPABASE_PAGE_SIZE) break
    offset += SUPABASE_PAGE_SIZE
  }

  return rows
}

async function fetchSupabaseAuthUsers({ baseUrl, key, userFilter }) {
  const users = []
  let page = 1

  for (;;) {
    const url = new URL(`${baseUrl}/auth/v1/admin/users`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('per_page', String(SUPABASE_AUTH_PAGE_SIZE))

    const response = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Supabase auth users ${response.status}: ${text}`)
    }

    const payload = await response.json()
    const pageUsers = Array.isArray(payload.users) ? payload.users : []
    if (pageUsers.length === 0) break

    for (const user of pageUsers) {
      if (!userFilter || user.id === userFilter) {
        users.push(user)
      }
    }

    if (pageUsers.length < SUPABASE_AUTH_PAGE_SIZE) break
    page += 1
  }

  return users
}

function batch(array, size) {
  const slices = []
  for (let index = 0; index < array.length; index += size) {
    slices.push(array.slice(index, index + size))
  }
  return slices
}

function buildKey(userId, legacyId) {
  return `${userId}::${legacyId}`
}

async function importAuthUsers({
  client,
  secret,
  authUsers,
  dryRun,
  skipPasswordReset,
  resetRedirectTo,
}) {
  const mappings = new Map()
  const uniqueEmails = new Set()
  let createdCount = 0
  let existingCount = 0

  const rows = authUsers
    .filter((user) => typeof user.email === 'string' && user.email.length > 0)
    .map((user) => ({
      sourceSupabaseUserId: String(user.id),
      email: normalizeEmail(user.email),
      name: normalizeName(user),
      emailVerified: Boolean(user.email_confirmed_at ?? user.confirmed_at),
      createdAt: toMillis(user.created_at),
      updatedAt: toMillis(user.updated_at),
    }))

  if (dryRun) {
    for (const row of rows) {
      mappings.set(row.sourceSupabaseUserId, row.sourceSupabaseUserId)
      uniqueEmails.add(row.email)
    }
    return {
      createdCount,
      existingCount,
      mappingBySourceUserId: mappings,
      resetRequestedCount: 0,
      authRows: rows.length,
    }
  }

  for (const chunk of batch(rows, AUTH_BATCH_SIZE)) {
    const result = await client.mutation(api.library.importAuthUsersBatch, {
      secret,
      rows: chunk,
    })

    createdCount += result.createdCount
    existingCount += result.existingCount
    for (const mapping of result.mappings) {
      mappings.set(mapping.sourceSupabaseUserId, mapping.targetUserId)
      uniqueEmails.add(mapping.email)
    }
    process.stdout.write('.')
  }
  process.stdout.write('\n')

  let resetRequestedCount = 0
  if (!skipPasswordReset && uniqueEmails.size > 0) {
    const emails = Array.from(uniqueEmails)
    for (const emailChunk of batch(emails, BATCH_SIZE)) {
      const result = await client.mutation(api.library.requestPasswordResetBatch, {
        secret,
        emails: emailChunk,
        redirectTo: resetRedirectTo ?? undefined,
      })
      resetRequestedCount += result.requestedCount
      process.stdout.write('.')
    }
    process.stdout.write('\n')
  }

  return {
    createdCount,
    existingCount,
    mappingBySourceUserId: mappings,
    resetRequestedCount,
    authRows: rows.length,
  }
}

async function importAuthors({ client, secret, rows, mappingBySourceUserId, dryRun }) {
  const transformedRows = []
  let unresolvedOwnerCount = 0
  let duplicateLegacyCount = 0
  const uniqueKeys = new Set()
  let insertedCount = 0
  let updatedCount = 0

  for (const row of rows) {
    const targetUserId = mappingBySourceUserId.get(String(row.user_id))
    if (!targetUserId) {
      unresolvedOwnerCount += 1
      continue
    }

    const transformedRow = {
      userId: targetUserId,
      legacyId: String(row.id),
      name: String(row.name),
      createdAt: toMillis(row.created_at),
      updatedAt: toMillis(row.updated_at),
    }

    const key = buildKey(transformedRow.userId, transformedRow.legacyId)
    if (uniqueKeys.has(key)) duplicateLegacyCount += 1
    uniqueKeys.add(key)
    transformedRows.push(transformedRow)
  }

  if (!dryRun) {
    for (const chunk of batch(transformedRows, BATCH_SIZE)) {
      const result = await client.mutation(api.library.importAuthorsBatch, {
        secret,
        rows: chunk,
      })
      insertedCount += result.insertedCount
      updatedCount += result.updatedCount
      process.stdout.write('.')
    }
    process.stdout.write('\n')
  }

  return {
    sourceCount: rows.length,
    importedCount: transformedRows.length,
    unresolvedOwnerCount,
    duplicateLegacyCount,
    insertedCount,
    updatedCount,
    keySet: uniqueKeys,
  }
}

async function importSeries({
  client,
  secret,
  rows,
  mappingBySourceUserId,
  authorKeySet,
  dryRun,
}) {
  const transformedRows = []
  let unresolvedOwnerCount = 0
  let unresolvedAuthorReferenceCount = 0
  let duplicateLegacyCount = 0
  const uniqueKeys = new Set()
  let insertedCount = 0
  let updatedCount = 0

  for (const row of rows) {
    const targetUserId = mappingBySourceUserId.get(String(row.user_id))
    if (!targetUserId) {
      unresolvedOwnerCount += 1
      continue
    }

    const authorLegacyId = row.author_id ? String(row.author_id) : undefined
    if (authorLegacyId) {
      const authorKey = buildKey(targetUserId, authorLegacyId)
      if (!authorKeySet.has(authorKey)) {
        unresolvedAuthorReferenceCount += 1
      }
    }

    const transformedRow = {
      userId: targetUserId,
      legacyId: String(row.id),
      name: String(row.name),
      description:
        typeof row.description === 'string' ? row.description : undefined,
      totalBooks:
        typeof row.total_books === 'number' && Number.isFinite(row.total_books)
          ? row.total_books
          : 0,
      authorLegacyId,
      coverUrl: typeof row.cover_url === 'string' ? row.cover_url : undefined,
      createdAt: toMillis(row.created_at),
      updatedAt: toMillis(row.updated_at),
    }

    const key = buildKey(transformedRow.userId, transformedRow.legacyId)
    if (uniqueKeys.has(key)) duplicateLegacyCount += 1
    uniqueKeys.add(key)
    transformedRows.push(transformedRow)
  }

  if (!dryRun) {
    for (const chunk of batch(transformedRows, BATCH_SIZE)) {
      const result = await client.mutation(api.library.importSeriesBatch, {
        secret,
        rows: chunk,
      })
      insertedCount += result.insertedCount
      updatedCount += result.updatedCount
      process.stdout.write('.')
    }
    process.stdout.write('\n')
  }

  return {
    sourceCount: rows.length,
    importedCount: transformedRows.length,
    unresolvedOwnerCount,
    unresolvedAuthorReferenceCount,
    duplicateLegacyCount,
    insertedCount,
    updatedCount,
    keySet: uniqueKeys,
  }
}

async function importBooks({
  client,
  secret,
  rows,
  mappingBySourceUserId,
  seriesKeySet,
  dryRun,
}) {
  const transformedRows = []
  let unresolvedOwnerCount = 0
  let unresolvedSeriesReferenceCount = 0
  let duplicateLegacyCount = 0
  const uniqueKeys = new Set()
  let insertedCount = 0
  let updatedCount = 0

  for (const row of rows) {
    const targetUserId = mappingBySourceUserId.get(String(row.user_id))
    if (!targetUserId) {
      unresolvedOwnerCount += 1
      continue
    }

    const seriesLegacyId = row.series_id ? String(row.series_id) : undefined
    if (seriesLegacyId) {
      const seriesKey = buildKey(targetUserId, seriesLegacyId)
      if (!seriesKeySet.has(seriesKey)) {
        unresolvedSeriesReferenceCount += 1
      }
    }

    const transformedRow = {
      userId: targetUserId,
      legacyId: String(row.id),
      title: String(row.title),
      seriesLegacyId,
      seriesOrder:
        typeof row.series_order === 'number' && Number.isFinite(row.series_order)
          ? row.series_order
          : undefined,
      status: String(row.status),
      rating:
        typeof row.rating === 'number' && Number.isFinite(row.rating)
          ? row.rating
          : undefined,
      notes: typeof row.notes === 'string' ? row.notes : undefined,
      coverUrl: typeof row.cover_url === 'string' ? row.cover_url : undefined,
      readDate: row.read_date ? toMillis(row.read_date) : undefined,
      releaseDate: row.release_date ? toMillis(row.release_date) : undefined,
      createdAt: toMillis(row.created_at),
      updatedAt: toMillis(row.updated_at),
    }

    const key = buildKey(transformedRow.userId, transformedRow.legacyId)
    if (uniqueKeys.has(key)) duplicateLegacyCount += 1
    uniqueKeys.add(key)
    transformedRows.push(transformedRow)
  }

  if (!dryRun) {
    for (const chunk of batch(transformedRows, BATCH_SIZE)) {
      const result = await client.mutation(api.library.importBooksBatch, {
        secret,
        rows: chunk,
      })
      insertedCount += result.insertedCount
      updatedCount += result.updatedCount
      process.stdout.write('.')
    }
    process.stdout.write('\n')
  }

  return {
    sourceCount: rows.length,
    importedCount: transformedRows.length,
    unresolvedOwnerCount,
    unresolvedSeriesReferenceCount,
    duplicateLegacyCount,
    insertedCount,
    updatedCount,
  }
}

async function main() {
  const baseUrl = requireEnv('SUPABASE_URL').replace(/\/$/, '')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const convexUrl = requireEnv('CONVEX_URL')
  const secret = requireEnv('MIGRATION_SECRET')
  const sourceUserIdFilter = optionalEnv('SOURCE_SUPABASE_USER_ID')
  const dryRun = parseBooleanEnv('MIGRATION_DRY_RUN')
  const skipPasswordReset = parseBooleanEnv('MIGRATION_SKIP_PASSWORD_RESET')
  const resetRedirectTo =
    optionalEnv('MIGRATION_RESET_REDIRECT_TO') ??
    (optionalEnv('SITE_URL') ? `${optionalEnv('SITE_URL')}/reset-password` : null)

  const client = new ConvexHttpClient(convexUrl)

  console.info('Fetching Supabase auth users...')
  const authUsers = await fetchSupabaseAuthUsers({
    baseUrl,
    key,
    userFilter: sourceUserIdFilter,
  })

  console.info('Importing auth users...')
  const authSummary = await importAuthUsers({
    client,
    secret,
    authUsers,
    dryRun,
    skipPasswordReset,
    resetRedirectTo,
  })

  console.info('Fetching authors...')
  const authorRows = await fetchSupabaseTableRows({
    baseUrl,
    key,
    table: 'authors',
    userFilter: sourceUserIdFilter,
  })
  const authorSummary = await importAuthors({
    client,
    secret,
    rows: authorRows,
    mappingBySourceUserId: authSummary.mappingBySourceUserId,
    dryRun,
  })

  console.info('Fetching series...')
  const seriesRows = await fetchSupabaseTableRows({
    baseUrl,
    key,
    table: 'series',
    userFilter: sourceUserIdFilter,
  })
  const seriesSummary = await importSeries({
    client,
    secret,
    rows: seriesRows,
    mappingBySourceUserId: authSummary.mappingBySourceUserId,
    authorKeySet: authorSummary.keySet,
    dryRun,
  })

  console.info('Fetching books...')
  const bookRows = await fetchSupabaseTableRows({
    baseUrl,
    key,
    table: 'books',
    userFilter: sourceUserIdFilter,
  })
  const bookSummary = await importBooks({
    client,
    secret,
    rows: bookRows,
    mappingBySourceUserId: authSummary.mappingBySourceUserId,
    seriesKeySet: seriesSummary.keySet,
    dryRun,
  })

  const summary = {
    mode: dryRun ? 'dry-run' : 'apply',
    sourceUserIdFilter,
    auth: {
      sourceCount: authUsers.length,
      transformedCount: authSummary.authRows,
      createdCount: authSummary.createdCount,
      existingCount: authSummary.existingCount,
      mappingCount: authSummary.mappingBySourceUserId.size,
      resetRequestedCount: authSummary.resetRequestedCount,
    },
    authors: authorSummary,
    series: {
      sourceCount: seriesSummary.sourceCount,
      importedCount: seriesSummary.importedCount,
      unresolvedOwnerCount: seriesSummary.unresolvedOwnerCount,
      unresolvedAuthorReferenceCount: seriesSummary.unresolvedAuthorReferenceCount,
      duplicateLegacyCount: seriesSummary.duplicateLegacyCount,
      insertedCount: seriesSummary.insertedCount,
      updatedCount: seriesSummary.updatedCount,
    },
    books: bookSummary,
  }

  console.info('Migration summary:')
  console.info(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

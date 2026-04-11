/* eslint-disable */
/**
 * Generated `api` utility — replace by running `npx convex dev`.
 * @module
 */
import type * as auth from '../auth.js'
import type * as authors from '../authors.js'
import type * as books from '../books.js'
import type * as http from '../http.js'
import type * as library from '../library.js'
import type * as series from '../series.js'
import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server'

declare const fullApi: ApiFromModules<{
  auth: typeof auth
  authors: typeof authors
  books: typeof books
  http: typeof http
  library: typeof library
  series: typeof series
}>

export declare const api: FilterApi<typeof fullApi, FunctionReference>
export declare const internal: FilterApi<typeof fullApi, FunctionReference>

// Populated precisely after `npx convex dev`; `any` keeps local builds working without a linked deployment.
export declare const components: any

<template>
  <div class="relative">
    <div class="relative">
      <UInput
        v-model="searchQuery"
        type="text"
        placeholder="Search for books..."
        icon="i-lucide-search"
        class="w-full"
        @update:model-value="handleSearch"
        @focus="showResults = true"
        @blur="handleBlur"
      />
    </div>

    <div
      v-if="loading"
      class="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-900"
    >
      <div class="flex items-center justify-center gap-2">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" />
        <span class="text-sm text-stone-600 dark:text-stone-400">Searching…</span>
      </div>
    </div>

    <div
      v-if="showResults && searchResults.length > 0 && !loading"
      class="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
    >
      <div class="p-2">
        <div class="mb-2 text-xs text-stone-500">Found {{ searchResults.length }} results</div>
        <button
          v-for="book in searchResults"
          :key="book.key"
          type="button"
          class="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800"
          @mousedown.prevent
          @click="selectBook(book)"
        >
          <div class="shrink-0">
            <img
              v-if="book.cover_i"
              :src="`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`"
              :alt="book.title"
              class="h-16 w-12 rounded object-cover shadow-sm"
              @error="handleImageError"
            />
            <div
              v-else
              class="flex h-16 w-12 items-center justify-center rounded bg-stone-100 dark:bg-stone-800"
            >
              <UIcon name="i-lucide-book" class="size-6 text-stone-400" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
              {{ book.title }}
            </h4>
            <p
              v-if="book.author_name && book.author_name.length > 0"
              class="truncate text-xs text-stone-600 dark:text-stone-400"
            >
              by {{ book.author_name.join(', ') }}
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <span v-if="book.first_publish_year" class="text-xs text-stone-500">
                {{ book.first_publish_year }}
              </span>
              <span
                v-if="book.series && book.series.length > 0"
                class="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
              >
                Series
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div
      v-if="showResults && searchResults.length === 0 && searchQuery && !loading"
      class="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-900"
    >
      <p class="text-center text-sm text-stone-500">No books found for "{{ searchQuery }}"</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { OpenLibraryBook, OpenLibrarySearchResponse } from '~/types/library'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [book: OpenLibraryBook]
}>()

const searchQuery = ref(props.modelValue || '')
const searchResults = ref<OpenLibraryBook[]>([])
const loading = ref(false)
const showResults = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== searchQuery.value) {
      searchQuery.value = newValue || ''
    }
  },
)

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue)
})

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    await performSearch()
  }, 300)
}

async function performSearch() {
  if (!searchQuery.value || searchQuery.value.length < 2) return
  loading.value = true
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery.value)}&limit=10&fields=key,title,author_name,cover_i,first_publish_year,series,series_key,series_number`,
    )
    if (!response.ok) throw new Error('Search failed')
    const data: OpenLibrarySearchResponse = await response.json()
    searchResults.value = data.docs || []
  } catch (error) {
    console.error('Book search error:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

function selectBook(book: OpenLibraryBook) {
  searchQuery.value = book.title
  showResults.value = false
  emit('select', book)
}

function handleBlur() {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

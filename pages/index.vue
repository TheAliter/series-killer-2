<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:hidden">
      <div>
        <h1 class="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-100">Your library</h1>
        <p class="text-sm text-stone-500">Series and reading progress</p>
      </div>
      <div class="flex gap-2">
        <UButton to="/series/add" icon="i-lucide-plus" class="flex-1">Add series</UButton>
      </div>
    </div>

    <div v-if="library.loading.value" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="library.series.value.length > 0" class="grid gap-4 lg:grid-cols-2">
      <SkSeriesCard
        v-for="s in library.series.value"
        :key="s.id"
        :series="s"
        :show-actions="true"
        :is-expanded="expandedSeriesId === s.id"
        @toggle-expand="toggleExpand(s.id)"
        @edit="editSeries"
        @delete="onDeleteSeries"
        @add-book="addBookToSeries"
        @edit-book="onEditBook"
        @delete-book="onDeleteBook"
        @update-book-status="onUpdateBookStatus"
      />
    </div>

    <UCard v-else class="py-16 text-center">
      <UIcon name="i-lucide-layers" class="mx-auto mb-3 size-12 text-stone-300" />
      <h3 class="font-serif text-lg font-semibold">No series yet</h3>
      <p class="mt-1 text-sm text-stone-500">Add your first series to get started.</p>
      <UButton to="/series/add" class="mt-4" icon="i-lucide-plus">Add series</UButton>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { Book, Series } from '~/types/library'

definePageMeta({
  layout: 'default',
  convexAuth: true,
})

const library = useLibrary()
const expandedSeriesId = ref<string | null>(null)

const EXPANDED_KEY = 'series-killer-expanded-series'
const SCROLL_KEY = 'series-killer-scroll-position'

onMounted(async () => {
  await library.fetchAll()
  if (import.meta.client) {
    const saved = localStorage.getItem(EXPANDED_KEY)
    if (saved && library.series.value.some((s) => s.id === saved)) {
      expandedSeriesId.value = saved
    } else if (saved) {
      localStorage.removeItem(EXPANDED_KEY)
    }
    await nextTick()
    setTimeout(() => {
      const y = localStorage.getItem(SCROLL_KEY)
      if (y) {
        const scrollY = parseInt(y, 10)
        if (!Number.isNaN(scrollY)) {
          setTimeout(() => {
            const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
            window.scrollTo(0, Math.min(scrollY, maxY))
            localStorage.removeItem(SCROLL_KEY)
          }, 50)
        }
      }
    }, 150)
  }
})

function toggleExpand(seriesId: string) {
  if (expandedSeriesId.value === seriesId) {
    expandedSeriesId.value = null
    if (import.meta.client) localStorage.removeItem(EXPANDED_KEY)
  } else {
    expandedSeriesId.value = seriesId
    if (import.meta.client) localStorage.setItem(EXPANDED_KEY, seriesId)
  }
}

function editSeries(s: Series) {
  navigateTo(`/series/edit/${s.id}`)
}

function addBookToSeries(s: Series) {
  if (import.meta.client) localStorage.setItem(SCROLL_KEY, String(window.scrollY))
  navigateTo(`/series/${s.id}/add-book`)
}

async function onDeleteSeries(s: Series) {
  if (!confirm(`Delete series "${s.name}"? This cannot be undone.`)) return
  await library.deleteSeries(s.id)
  if (expandedSeriesId.value === s.id) {
    expandedSeriesId.value = null
    if (import.meta.client) localStorage.removeItem(EXPANDED_KEY)
  }
}

function onEditBook(book: Book) {
  if (book.series_id && import.meta.client) {
    localStorage.setItem(EXPANDED_KEY, book.series_id)
  }
  if (import.meta.client) localStorage.setItem(SCROLL_KEY, String(window.scrollY))
  navigateTo(`/book/edit/${book.id}`)
}

async function onDeleteBook(book: Book) {
  if (!confirm(`Delete book "${book.title}"?`)) return
  await library.deleteBook(book.id)
}

async function onUpdateBookStatus(bookId: string, status: Book['status']) {
  await library.updateBook(bookId, { status })
}
</script>

<template>
  <UCard class="overflow-hidden">
    <div class="space-y-3 p-4">
      <div class="flex items-start gap-3">
        <button
          type="button"
          class="flex min-w-0 flex-1 cursor-pointer text-left"
          @click="$emit('toggleExpand')"
        >
          <div class="mr-3 h-24 w-[5.5rem] shrink-0 overflow-hidden rounded-md bg-stone-200 dark:bg-stone-700">
            <img
              v-if="series.cover_url"
              :src="series.cover_url"
              alt=""
              class="h-full w-full object-cover"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              {{ series.name }}
            </h3>
            <p v-if="series.authors?.name" class="text-xs text-stone-500">by {{ series.authors.name }}</p>
            <p v-if="series.description" class="mt-1 line-clamp-2 text-xs text-stone-500">
              {{ series.description }}
            </p>
          </div>
        </button>
        <div v-if="showActions" class="flex shrink-0 gap-1">
          <UButton size="sm" variant="ghost" icon="i-lucide-book-plus" @click="$emit('addBook', series)" />
          <UButton size="sm" variant="ghost" icon="i-lucide-pencil" @click="$emit('edit', series)" />
          <UButton size="sm" variant="ghost" color="error" icon="i-lucide-trash-2" @click="$emit('delete', series)" />
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-1 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
          <div
            class="h-full rounded-full transition-all"
            :class="progressPercentage === 100 ? 'bg-emerald-500' : 'bg-primary'"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
        <span class="whitespace-nowrap text-xs text-stone-500">
          {{ completedBooks }} / {{ series.total_books }}
        </span>
      </div>
    </div>

    <div
      v-if="isExpanded && sortedBooks.length > 0"
      class="border-t border-stone-100 px-4 pb-4 dark:border-stone-800"
    >
      <p class="mb-2 mt-3 text-[0.65rem] font-semibold uppercase tracking-wide text-stone-500">
        Books in this series
      </p>
      <SkBookRow
        v-for="b in sortedBooks"
        :key="b.id"
        :book="b"
        @edit="$emit('editBook', $event)"
        @delete="$emit('deleteBook', $event)"
        @update-status="(id, s) => $emit('updateBookStatus', id, s)"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Book, Series } from '~/types/library'

const props = defineProps<{
  series: Series
  showActions?: boolean
  isExpanded?: boolean
}>()

defineEmits<{
  edit: [series: Series]
  delete: [series: Series]
  addBook: [series: Series]
  toggleExpand: []
  editBook: [book: Book]
  deleteBook: [book: Book]
  updateBookStatus: [bookId: string, status: Book['status']]
}>()

const sortedBooks = computed(() => {
  if (!props.series.books) return []
  return [...props.series.books].sort((a, b) => (a.series_order || 0) - (b.series_order || 0))
})

const completedBooks = computed(() => {
  if (!props.series.books) return 0
  return props.series.books.filter((book) => book.status === 'completed').length
})

const progressPercentage = computed(() => {
  if (!props.series.total_books || props.series.total_books === 0) return 0
  return Math.round((completedBooks.value / props.series.total_books) * 100)
})
</script>

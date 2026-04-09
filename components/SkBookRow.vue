<template>
  <div class="relative border-b border-stone-100 py-3 last:border-0 dark:border-stone-800">
    <div
      v-if="isFutureRelease"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-stone-900/85 p-4"
    >
      <UIcon name="i-lucide-lock" class="absolute left-2 top-2 size-4 text-white" />
      <h3 class="text-center text-sm font-semibold text-white">{{ book.title }}</h3>
      <p class="mt-2 text-xs text-white/90">Releases {{ formatReleaseDate(book.release_date!) }}</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="h-12 w-8 shrink-0 overflow-hidden rounded-sm bg-stone-200 dark:bg-stone-700">
        <img
          v-if="book.cover_url"
          :src="book.cover_url"
          :alt="book.title"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center">
          <UIcon name="i-lucide-book" class="size-4 text-stone-400" />
        </div>
      </div>

      <div class="min-w-0 flex-1" :class="{ 'opacity-0': isFutureRelease }">
        <div class="flex min-w-0 items-baseline gap-1">
          <h3 class="truncate text-sm font-medium text-stone-900 dark:text-stone-100" :title="book.title">
            {{ book.title }}
          </h3>
          <span v-if="book.series_order" class="shrink-0 text-xs text-stone-500">
            · Book {{ book.series_order }}
          </span>
        </div>
      </div>

      <USelect
        v-if="!isFutureRelease"
        :model-value="book.status"
        :items="statusItems"
        size="xs"
        class="w-36"
        @update:model-value="onStatusChange"
      />

      <div class="flex shrink-0 gap-1" :class="{ 'opacity-0': isFutureRelease }">
        <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="$emit('edit', book)" />
        <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="$emit('delete', book)" />
      </div>
    </div>

    <div
      v-if="!isFutureRelease && (book.notes || book.read_date)"
      class="ml-10 mt-2 space-y-1 border-t border-stone-100 pt-2 text-xs text-stone-500 dark:border-stone-800"
    >
      <p v-if="book.notes" class="italic">"{{ book.notes }}"</p>
      <p v-if="book.read_date">Finished {{ formatDate(book.read_date) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '~/types/library'

type BookStatus = Book['status']

const props = defineProps<{ book: Book }>()
const emit = defineEmits<{
  edit: [book: Book]
  delete: [book: Book]
  updateStatus: [bookId: string, status: BookStatus]
}>()

const statusItems = [
  { label: 'Want to read', value: 'want_to_read' },
  { label: 'Reading', value: 'reading' },
  { label: 'Completed', value: 'completed' },
  { label: 'Dropped', value: 'dropped' },
]

const isFutureRelease = computed(() => {
  if (!props.book.release_date) return false
  const releaseDate = new Date(props.book.release_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return releaseDate > today
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatReleaseDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function onStatusChange(value: unknown) {
  if (typeof value === 'string') {
    emit('updateStatus', props.book.id, value as BookStatus)
  }
}
</script>

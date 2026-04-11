<template>
  <div class="mx-auto max-w-lg space-y-6">
    <h2 class="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
      {{ isEditing ? 'Edit book' : 'Add book' }}
    </h2>

    <div v-if="!book && isEditing" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>

    <UForm v-else :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Search for book">
        <SkOpenLibraryBookSearch v-model="searchQuery" @select="handleBookSelect" />
        <template #hint>
          <span class="text-xs text-stone-500">
            Search Open Library to auto-fill fields below.
          </span>
        </template>
      </UFormField>

      <UFormField label="Title" name="title" required>
        <UInput v-model="form.title" required />
      </UFormField>

      <UFormField label="Cover URL" name="cover_url">
        <UInput
          :model-value="form.cover_url ?? ''"
          type="url"
          placeholder="https://..."
          @update:model-value="form.cover_url = ($event as string) || null"
        />
      </UFormField>

      <UFormField label="Status" name="status" required>
        <USelect
          v-model="form.status"
          :items="[
            { label: 'Want to read', value: 'want_to_read' },
            { label: 'Reading', value: 'reading' },
            { label: 'Completed', value: 'completed' },
            { label: 'Dropped', value: 'dropped' },
          ]"
        />
      </UFormField>

      <UFormField label="Series order" name="series_order">
        <UInput
          :model-value="form.series_order ?? undefined"
          type="number"
          min="1"
          @update:model-value="onSeriesOrderInput"
        />
      </UFormField>

      <UFormField label="Release date" name="release_date">
        <UInput
          :model-value="form.release_date ?? ''"
          type="date"
          @update:model-value="form.release_date = ($event as string) || null"
        />
        <template #hint>
          <span class="text-xs text-stone-500">Leave empty if already released.</span>
        </template>
      </UFormField>

      <UFormField label="Notes" name="notes">
        <UTextarea
          :model-value="form.notes ?? ''"
          :rows="2"
          autoresize
          @update:model-value="form.notes = ($event as string) || null"
        />
      </UFormField>

      <UFormField label="Rating" name="rating">
        <USelect
          v-model="form.rating"
          :items="[
            { label: 'No rating', value: null },
            { label: '1 / 5', value: 1 },
            { label: '2 / 5', value: 2 },
            { label: '3 / 5', value: 3 },
            { label: '4 / 5', value: 4 },
            { label: '5 / 5', value: 5 },
          ]"
        />
      </UFormField>

      <div class="flex gap-2 pt-2">
        <UButton type="button" color="neutral" variant="outline" class="flex-1" @click="$emit('cancel')">
          Cancel
        </UButton>
        <UButton type="submit" class="flex-1" :loading="loading" :disabled="isEditing && !book">
          {{ isEditing ? 'Update' : 'Add' }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { processOpenLibraryBook } from '~/utils/bookSearch'
import type { Book, BookFormData, OpenLibraryBook } from '~/types/library'

const props = defineProps<{
  book?: Book | null
  seriesId?: string | null
}>()

const emit = defineEmits<{
  save: [data: BookFormData & { id?: string }]
  cancel: []
}>()

const isEditing = computed(() => !!props.book)
const loading = ref(false)
const searchQuery = ref('')

const form = ref<BookFormData>({
  title: '',
  series_id: props.seriesId || null,
  series_order: null,
  status: 'want_to_read',
  rating: null,
  notes: '',
  cover_url: '',
  read_date: null,
  release_date: null,
})

watch(
  () => props.seriesId,
  (newSeriesId) => {
    form.value.series_id = newSeriesId || null
  },
)

watch(
  () => props.book,
  (newBook) => {
    if (newBook && isEditing.value) {
      form.value = {
        title: newBook.title,
        series_id: newBook.series_id || props.seriesId || null,
        series_order: newBook.series_order,
        status: newBook.status,
        rating: newBook.rating ?? null,
        notes: newBook.notes || '',
        cover_url: newBook.cover_url || '',
        read_date: newBook.read_date,
        release_date: newBook.release_date
          ? newBook.release_date.slice(0, 10)
          : null,
      }
      searchQuery.value = newBook.title
    }
  },
  { immediate: true },
)

function onSeriesOrderInput(value: string | number) {
  if (value === '' || value === undefined || value === null) {
    form.value.series_order = null
    return
  }
  const parsed = typeof value === 'number' ? value : Number(value)
  form.value.series_order = Number.isFinite(parsed) ? parsed : null
}

function handleBookSelect(book: OpenLibraryBook) {
  const processed = processOpenLibraryBook(book)
  form.value.title = processed.title
  if (processed.cover_url) form.value.cover_url = processed.cover_url
  if (processed.series_info?.order && props.seriesId) {
    form.value.series_order = processed.series_info.order
  }
  if (processed.first_publish_year && !form.value.release_date) {
    form.value.release_date = `${processed.first_publish_year}-01-01`
  }
}

function onSubmit() {
  loading.value = true
  try {
    const payload = { ...form.value }
    if ((payload.series_order as unknown) === '') {
      payload.series_order = null
    }
    if (isEditing.value && props.book) {
      emit('save', { ...payload, id: props.book.id })
    } else {
      emit('save', payload)
    }
  } finally {
    loading.value = false
  }
}
</script>

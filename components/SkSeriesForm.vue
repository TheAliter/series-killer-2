<template>
  <div class="mx-auto max-w-lg space-y-6">
    <h2 class="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
      {{ isEditing ? 'Edit series' : 'Add series' }}
    </h2>

    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Search for a book">
        <SkOpenLibraryBookSearch v-model="searchQuery" @select="handleBookSelect" />
        <template #hint>
          <span class="text-xs text-stone-500">Prefill name, author, and cover from Open Library.</span>
        </template>
      </UFormField>

      <UFormField label="Series name" name="name" required>
        <UInput v-model="form.name" required />
      </UFormField>

      <UFormField label="Author" name="author">
        <UInput v-model="authorName" placeholder="Author name" />
      </UFormField>

      <UFormField label="Cover image URL" name="cover_url">
        <UInput v-model="form.cover_url" type="url" placeholder="https://..." />
      </UFormField>

      <UFormField label="Total books" name="total_books">
        <UInput v-model.number="form.total_books" type="number" min="0" />
        <template #hint>
          <span class="text-xs text-stone-500">
            If set, placeholder books are created (same as legacy app).
          </span>
        </template>
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model="form.description" :rows="3" autoresize />
      </UFormField>

      <div class="flex gap-2 pt-2">
        <UButton type="button" color="neutral" variant="outline" class="flex-1" @click="$emit('cancel')">
          Cancel
        </UButton>
        <UButton type="submit" class="flex-1" :loading="loading">
          {{ isEditing ? 'Update' : 'Add' }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { findOrCreateAuthor } from '~/utils/bookSearch'
import type { OpenLibraryBook, Series } from '~/types/library'

interface SeriesFormPayload {
  name: string
  description?: string
  total_books: number
  cover_url?: string
  author_id?: string | null
}

const props = defineProps<{ series?: Series | null }>()
const emit = defineEmits<{
  save: [data: SeriesFormPayload]
  cancel: []
}>()

const library = useLibrary()

const loading = ref(false)
const isEditing = computed(() => !!props.series)
const searchQuery = ref('')
const authorName = ref('')

const form = ref({
  name: '',
  description: '',
  total_books: 0,
  cover_url: '',
})

watch(
  () => props.series,
  (series) => {
    if (series) {
      form.value = {
        name: series.name,
        description: series.description || '',
        total_books: series.total_books || 0,
        cover_url: series.cover_url || '',
      }
      if (series.authors?.name) {
        authorName.value = series.authors.name
      }
    }
  },
  { immediate: true },
)

function handleBookSelect(book: OpenLibraryBook) {
  form.value.name = book.title
  if (book.author_name?.length) {
    authorName.value = book.author_name.join(', ')
  }
  if (book.cover_i) {
    form.value.cover_url = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
  }
}

async function onSubmit() {
  loading.value = true
  try {
    let authorId: string | null = null
    if (authorName.value.trim()) {
      const { author, isNew } = findOrCreateAuthor(
        authorName.value.trim(),
        library.authors.value,
      )
      if (isNew) {
        const created = await library.addAuthor(authorName.value.trim())
        authorId = created.id
      } else {
        authorId = author?.id ?? null
      }
    }
    emit('save', {
      name: form.value.name,
      description: form.value.description || undefined,
      total_books: Number.isFinite(form.value.total_books) ? form.value.total_books : 0,
      cover_url: form.value.cover_url || undefined,
      author_id: authorId,
    })
  } finally {
    loading.value = false
  }
}
</script>

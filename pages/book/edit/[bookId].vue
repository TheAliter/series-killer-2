<template>
  <div>
    <div v-if="library.loading.value" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <UAlert
      v-else-if="!book"
      color="error"
      variant="soft"
      title="Book not found"
      description="It may have been removed or the link is invalid."
    />
    <SkBookForm v-else :book="book" @save="onSave" @cancel="navigateTo('/')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookFormData } from '~/types/library'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const library = useLibrary()

const bookId = computed(() => String(route.params.bookId || ''))

const book = computed(() => library.books.value.find((b) => b.id === bookId.value) ?? null)

onMounted(async () => {
  await library.fetchAll()
})

async function onSave(data: BookFormData & { id?: string }) {
  if (!data.id) return
  await library.updateBook(data.id, data)
  await navigateTo('/')
}
</script>

<template>
  <div>
    <SkSeriesForm @save="onSave" @cancel="navigateTo('/')" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const library = useLibrary()

async function onSave(payload: {
  name: string
  description?: string
  total_books: number
  cover_url?: string
  author_id?: string | null
}) {
  await library.addSeries(payload)
  await navigateTo('/')
}
</script>

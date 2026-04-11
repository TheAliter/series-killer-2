<template>
  <div class="space-y-6">
    <UFormField label="Series (optional)" class="mx-auto max-w-lg">
      <USelect
        v-model="selectedSeriesId"
        value-key="value"
        label-key="label"
        :items="seriesItems"
        placeholder="No series"
      />
    </UFormField>
    <SkBookForm :series-id="selectedSeriesId" @save="onSave" @cancel="navigateTo('/')" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BookFormData } from '~/types/library'

definePageMeta({ layout: 'default', middleware: 'auth' })

const library = useLibrary()
const selectedSeriesId = ref<string | null>(null)

const seriesItems = computed(() => {
  const rows = library.series.value.map((s) => ({
    label: s.name,
    value: s.id,
  }))
  return [{ label: 'No series', value: null as string | null }, ...rows]
})

onMounted(async () => {
  await library.fetchAll()
})

async function onSave(data: BookFormData) {
  await library.addBook({
    ...data,
    series_id: data.series_id ?? selectedSeriesId.value,
  })
  await navigateTo('/')
}
</script>

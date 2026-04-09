<template>
  <div>
    <div v-if="library.loading.value" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <UAlert
      v-else-if="!series"
      color="error"
      variant="soft"
      title="Series not found"
      description="It may have been removed or the link is invalid."
    />
    <SkSeriesForm v-else :series="series" @save="onSave" @cancel="navigateTo('/')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const library = useLibrary()

const seriesId = computed(() => String(route.params.id || ''))

const series = computed(() =>
  library.series.value.find((s) => s.id === seriesId.value) ?? null,
)

onMounted(async () => {
  await library.fetchAll()
})

async function onSave(payload: {
  name: string
  description?: string
  total_books: number
  cover_url?: string
  author_id?: string | null
}) {
  await library.updateSeries(seriesId.value, payload)
  await navigateTo('/')
}
</script>

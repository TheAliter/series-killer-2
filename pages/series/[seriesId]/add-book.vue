<template>
  <div>
    <div v-if="library.loading.value" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <UAlert
      v-else-if="!seriesExists"
      color="error"
      variant="soft"
      title="Series not found"
      description="It may have been removed or the link is invalid."
    />
    <SkBookForm v-else :series-id="seriesId" @save="onSave" @cancel="navigateTo('/')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookFormData } from '~/types/library'

definePageMeta({ layout: 'default', convexAuth: true })

const route = useRoute()
const library = useLibrary()

const seriesId = computed(() => String(route.params.seriesId || ''))

const seriesExists = computed(() =>
  library.series.value.some((s) => s.id === seriesId.value),
)

onMounted(async () => {
  await library.fetchAll()
})

async function onSave(data: BookFormData) {
  await library.addBook({
    ...data,
    series_id: data.series_id ?? seriesId.value,
  })
  await navigateTo('/')
}
</script>

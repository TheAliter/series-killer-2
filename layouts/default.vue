<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-950">
    <header
      class="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90"
    >
      <UContainer class="flex items-center justify-between gap-3 py-3">
        <NuxtLink to="/" class="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
          Series Killer
        </NuxtLink>
        <nav class="flex items-center gap-2">
          <UButton to="/book/add" size="sm" color="neutral" variant="outline" icon="i-lucide-book-plus">
            Add book
          </UButton>
          <UButton to="/series/add" size="sm" icon="i-lucide-plus">
            Add series
          </UButton>
          <UButton to="/account/password" color="neutral" variant="ghost" size="sm" icon="i-lucide-key-round">
            Password
          </UButton>
          <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-log-out" @click="signOut">
            Sign out
          </UButton>
        </nav>
      </UContainer>
    </header>
    <UContainer class="py-6">
      <slot />
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const { $authClient } = useNuxtApp()

async function signOut() {
  await $authClient.signOut()
  await navigateTo('/login')
}
</script>

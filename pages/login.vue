<template>
  <UCard class="w-full max-w-md p-6">
    <h1 class="mb-6 text-center font-serif text-2xl font-semibold">Sign in</h1>
    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email" required>
        <UInput v-model="form.email" type="email" autocomplete="email" required />
      </UFormField>
      <UFormField label="Password" name="password" required>
        <UInput v-model="form.password" type="password" autocomplete="current-password" required />
        <template #hint>
          <NuxtLink to="/forgot-password" class="text-xs text-primary">Forgot password?</NuxtLink>
        </template>
      </UFormField>
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <UButton type="submit" block :loading="loading">Sign in</UButton>
    </UForm>
    <p class="mt-4 text-center text-sm text-stone-500">
      No account?
      <NuxtLink to="/signup" class="font-medium text-primary">Sign up</NuxtLink>
    </p>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $authClient } = useNuxtApp()
const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const res = (await $authClient.signIn.email({
      email: form.email,
      password: form.password,
    })) as { error?: { message?: string } }
    if (res.error) {
      error.value = res.error.message || 'Sign in failed.'
      return
    }
    await navigateTo('/')
  } catch {
    error.value =
      'Could not reach the sign-in service. Check your network and Convex / auth URL configuration.'
  } finally {
    loading.value = false
  }
}
</script>

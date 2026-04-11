<template>
  <UCard class="w-full max-w-md p-6">
    <h1 class="mb-2 text-center font-serif text-2xl font-semibold">Reset password</h1>
    <p class="mb-6 text-center text-sm text-stone-500">
      We will email you a link if an account exists.
    </p>
    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email" required>
        <UInput v-model="form.email" type="email" autocomplete="email" required />
      </UFormField>
      <UAlert v-if="message" color="primary" variant="soft" :title="message" />
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <UButton type="submit" block :loading="loading">Send link</UButton>
    </UForm>
    <p class="mt-4 text-center text-sm">
      <NuxtLink to="/login" class="text-primary">Back to sign in</NuxtLink>
    </p>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const config = useRuntimeConfig()
const { client, isAuthenticated } = useConvexAuth()
const form = reactive({ email: '' })
const error = ref('')
const message = ref('')
const loading = ref(false)

watch(
  isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      navigateTo('/')
    }
  },
  { immediate: true },
)

async function onSubmit() {
  error.value = ''
  message.value = ''
  if (!client) {
    error.value = 'Auth client is not ready yet. Please refresh and try again.'
    return
  }
  loading.value = true
  try {
    const siteUrl = String(config.public.siteUrl || '').replace(/\/$/, '') || ''
    const redirectTo = siteUrl ? `${siteUrl}/reset-password` : undefined
    const res = await client.requestPasswordReset({
      email: form.email,
      redirectTo,
    })
    if (res.error) {
      error.value = res.error.message || 'Request failed.'
      return
    }
    message.value = 'If this email is registered, check your inbox for a reset link.'
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Request failed.'
  } finally {
    loading.value = false
  }
}
</script>

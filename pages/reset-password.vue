<template>
  <UCard class="w-full max-w-md p-6">
    <h1 class="mb-6 text-center font-serif text-2xl font-semibold">Set new password</h1>

    <div v-if="!token" class="space-y-4 text-center text-sm text-stone-500">
      <p>This page needs a valid token from your reset email.</p>
      <NuxtLink to="/forgot-password" class="font-medium text-primary">Request a new link</NuxtLink>
      <p>
        <NuxtLink to="/login" class="text-primary">Back to sign in</NuxtLink>
      </p>
    </div>

    <UForm v-else :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="New password" name="password" required>
        <UInput v-model="form.password" type="password" autocomplete="new-password" required minlength="8" />
      </UFormField>
      <UFormField label="Confirm password" name="confirm" required>
        <UInput v-model="form.confirm" type="password" autocomplete="new-password" required minlength="8" />
      </UFormField>
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <UButton type="submit" block :loading="loading">Update password</UButton>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const { $authClient } = useNuxtApp()

const token = computed(() => {
  const q = route.query.token
  return typeof q === 'string' ? q : ''
})

const form = reactive({ password: '', confirm: '' })
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  if (form.password !== form.confirm) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    const res = (await $authClient.resetPassword({
      newPassword: form.password,
      token: token.value,
    })) as { error?: { message?: string } }
    if (res.error) {
      error.value = res.error.message || 'Could not reset password.'
      return
    }
    await navigateTo('/login')
  } finally {
    loading.value = false
  }
}
</script>

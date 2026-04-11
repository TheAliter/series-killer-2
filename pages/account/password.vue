<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="font-serif text-2xl font-semibold">Change password</h1>
    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Current password" name="current" required>
        <UInput v-model="form.current" type="password" autocomplete="current-password" required />
      </UFormField>
      <UFormField label="New password" name="next" required>
        <UInput v-model="form.next" type="password" autocomplete="new-password" required minlength="8" />
      </UFormField>
      <UFormField label="Confirm new password" name="confirm" required>
        <UInput v-model="form.confirm" type="password" autocomplete="new-password" required minlength="8" />
      </UFormField>
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <div class="flex gap-2">
        <UButton type="button" color="neutral" variant="outline" class="flex-1" to="/">Cancel</UButton>
        <UButton type="submit" class="flex-1" :loading="loading">Update</UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', convexAuth: true })

const { client } = useConvexAuth()
const form = reactive({ current: '', next: '', confirm: '' })
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  if (!client) {
    error.value = 'Auth client is not ready yet. Please refresh and try again.'
    return
  }
  if (form.next !== form.confirm) {
    error.value = 'New passwords do not match.'
    return
  }
  loading.value = true
  try {
    const res = await client.changePassword({
      currentPassword: form.current,
      newPassword: form.next,
      revokeOtherSessions: false,
    })
    if (res.error) {
      error.value = res.error.message || 'Could not change password.'
      return
    }
    await navigateTo('/')
  } finally {
    loading.value = false
  }
}
</script>

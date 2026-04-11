<template>
  <UCard class="w-full max-w-md p-6">
    <h1 class="mb-6 text-center font-serif text-2xl font-semibold">Create account</h1>
    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email" required>
        <UInput v-model="form.email" type="email" autocomplete="email" required />
      </UFormField>
      <UFormField label="Password" name="password" required>
        <UInput v-model="form.password" type="password" autocomplete="new-password" required minlength="8" />
      </UFormField>
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <UButton type="submit" block :loading="loading">Sign up</UButton>
    </UForm>
    <p class="mt-4 text-center text-sm text-stone-500">
      Already have an account?
      <NuxtLink to="/login" class="font-medium text-primary">Sign in</NuxtLink>
    </p>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signUp, isAuthenticated } = useConvexAuth()
const form = reactive({ email: '', password: '' })
const error = ref('')
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
  loading.value = true
  try {
    const name = form.email.split('@')[0] || 'Reader'
    const res = await signUp.email({
      email: form.email,
      password: form.password,
      name,
    })
    if (res.error) {
      error.value = res.error.message || 'Sign up failed.'
      return
    }
    await navigateTo('/')
  } finally {
    loading.value = false
  }
}
</script>

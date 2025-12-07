<script setup lang="ts">
// Redirigir automáticamente al panel admin
definePageMeta({
  layout: false,
})

onMounted(() => {
  navigateTo('/admin')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
</template>




<script setup lang="ts">
interface Props {
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar...',
})
</script>

<template>
  <span class="pointer-events-none">
    <slot>{{ placeholder }}</slot>
  </span>
</template>



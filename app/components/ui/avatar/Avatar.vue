<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const classes = computed(() => cn(
  'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
  props.class
))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

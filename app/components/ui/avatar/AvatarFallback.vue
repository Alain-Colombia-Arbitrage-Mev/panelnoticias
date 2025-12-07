<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const classes = computed(() => cn(
  'flex h-full w-full items-center justify-center rounded-full bg-muted',
  props.class
))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

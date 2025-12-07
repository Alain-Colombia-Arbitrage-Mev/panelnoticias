<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const classes = computed(() => cn(
  'absolute z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
  props.class
))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>



<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const classes = computed(() => cn('rounded-2xl text-card-foreground glass transition-all duration-200', props.class))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

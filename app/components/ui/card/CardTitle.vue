<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const classes = computed(() => cn('font-semibold leading-none tracking-tight', props.class))
</script>

<template>
  <h3 :class="classes">
    <slot />
  </h3>
</template>

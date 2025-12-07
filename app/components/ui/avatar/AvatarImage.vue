<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  src?: string
  alt?: string
}

const props = defineProps<Props>()
const classes = computed(() => cn('aspect-square h-full w-full', props.class))
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" :class="classes" />
</template>

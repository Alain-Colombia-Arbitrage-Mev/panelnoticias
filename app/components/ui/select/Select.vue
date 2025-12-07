<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  disabled?: boolean
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const classes = computed(() => cn(
  'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
  props.class
))
</script>

<template>
  <select
    :class="classes"
    :disabled="disabled"
    :value="modelValue"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  type?: string
  placeholder?: string
  disabled?: boolean
  modelValue?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const classes = computed(() => cn(
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  props.class
))
</script>

<template>
  <input
    :type="type"
    :class="classes"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

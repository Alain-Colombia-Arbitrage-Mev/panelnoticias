<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  placeholder?: string
  disabled?: boolean
  rows?: number
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  rows: 3,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const classes = computed(() => cn(
  'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  props.class
))
</script>

<template>
  <textarea
    :class="classes"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

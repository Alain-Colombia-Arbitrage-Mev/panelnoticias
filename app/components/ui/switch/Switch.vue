<script setup lang="ts">
import { type HTMLAttributes, computed, ref } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  disabled?: boolean
  modelValue?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}

const classes = computed(() => cn(
  'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  props.modelValue ? 'bg-primary' : 'bg-input',
  props.class
))
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :id="id"
    :class="classes"
    @click="toggle"
  >
    <span
      :class="cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
        modelValue ? 'translate-x-4' : 'translate-x-0'
      )"
    />
  </button>
</template>

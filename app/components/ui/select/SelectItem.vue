<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  value: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const classes = computed(() => cn(
  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  props.class
))
</script>

<template>
  <option :class="classes" :value="value" :disabled="disabled">
    <slot />
  </option>
</template>



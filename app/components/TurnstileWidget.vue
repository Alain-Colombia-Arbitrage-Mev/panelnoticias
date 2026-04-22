<script setup lang="ts">
const emit = defineEmits<{
  (e: 'verify', token: string): void
  (e: 'expired'): void
  (e: 'error'): void
}>()

const props = withDefaults(defineProps<{
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
}>(), {
  theme: 'auto',
  size: 'flexible',
})

const config = useRuntimeConfig()
const siteKey = config.public.turnstileSiteKey as string | undefined

const containerRef = ref<HTMLDivElement | null>(null)
let widgetId: string | null = null

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
    __turnstileLoading?: Promise<void>
  }
}

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (window.__turnstileLoading) return window.__turnstileLoading

  window.__turnstileLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(script)
  })

  return window.__turnstileLoading
}

const render = async () => {
  if (!siteKey || !containerRef.value) return
  await loadScript()
  if (!window.turnstile || !containerRef.value) return

  widgetId = window.turnstile.render(containerRef.value, {
    sitekey: siteKey,
    theme: props.theme,
    size: props.size,
    callback: (token: string) => emit('verify', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
  })
}

const reset = () => {
  if (window.turnstile && widgetId) {
    window.turnstile.reset(widgetId)
  }
}

defineExpose({ reset })

onMounted(() => {
  render()
})

onBeforeUnmount(() => {
  if (window.turnstile && widgetId) {
    try { window.turnstile.remove(widgetId) } catch {}
  }
})
</script>

<template>
  <div v-if="siteKey" ref="containerRef" class="turnstile-container" />
  <div v-else class="text-xs text-muted-foreground">
    Captcha no configurado
  </div>
</template>

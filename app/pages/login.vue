<script setup lang="ts">
import { Eye, EyeOff, Newspaper, Loader2, ShieldAlert, Lock, BarChart3, Zap, Shield } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(false)
const error = ref('')

const showPassword = ref(false)
const loginAttempts = ref(0)
const isBlocked = ref(false)
const blockTimer = ref(0)

const form = ref({
  email: '',
  password: '',
})

const turnstileToken = ref('')
const turnstileRef = ref<{ reset: () => void } | null>(null)

const formError = ref('')

// Verificar si ya está autenticado
watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/admin')
  }
}, { immediate: true })

// Validación de email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Sanitizar input
const sanitizeInput = (input: string): string => {
  return input.trim().toLowerCase()
}

const handleSubmit = async () => {
  formError.value = ''

  // Verificar si está bloqueado
  if (isBlocked.value) {
    formError.value = `Demasiados intentos. Espera ${blockTimer.value} segundos.`
    return
  }

  const email = sanitizeInput(form.value.email)
  const password = form.value.password

  // Validaciones
  if (!email || !password) {
    formError.value = 'Por favor completa todos los campos'
    return
  }

  if (!isValidEmail(email)) {
    formError.value = 'Formato de correo electrónico inválido'
    return
  }

  if (password.length < 6) {
    formError.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  if (!turnstileToken.value) {
    formError.value = 'Por favor completa la verificación captcha'
    return
  }

  loading.value = true
  try {
    const result = await $fetch<{ success: boolean; session: any }>('/api/auth/login', {
      method: 'POST',
      body: {
        email,
        password,
        turnstileToken: turnstileToken.value,
      },
    })

    if (result?.success && result.session) {
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      })
      loginAttempts.value = 0
      navigateTo('/admin')
    } else {
      formError.value = 'Credenciales inválidas'
    }
  } catch (err: any) {
    loginAttempts.value++
    turnstileToken.value = ''
    turnstileRef.value?.reset()

    const message = err?.data?.message || err?.message || 'Error al intentar iniciar sesión'
    formError.value = message

    if (loginAttempts.value >= 5) {
      isBlocked.value = true
      blockTimer.value = 60

      const interval = setInterval(() => {
        blockTimer.value--
        if (blockTimer.value <= 0) {
          isBlocked.value = false
          loginAttempts.value = 0
          clearInterval(interval)
        }
      }, 1000)

      formError.value = 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente.'
    }
  } finally {
    loading.value = false
  }
}

const onTurnstileVerify = (token: string) => {
  turnstileToken.value = token
}

const onTurnstileExpired = () => {
  turnstileToken.value = ''
}

useHead({
  title: 'Iniciar Sesión - Panel de Noticias',
})
</script>

<template>
  <div class="min-h-screen flex bg-background">
    <!-- Left Side - Form -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="flex items-center gap-2.5 mb-10">
          <div class="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
            <Newspaper class="h-4.5 w-4.5 text-background" />
          </div>
          <span class="text-lg font-semibold tracking-tight">
            Panel de Noticias
          </span>
        </div>

        <!-- Title -->
        <div class="mb-8">
          <h1 class="text-2xl font-semibold tracking-tight mb-2">
            Iniciar Sesion
          </h1>
          <p class="text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al panel
          </p>
        </div>

        <!-- Blocked Warning -->
        <div v-if="isBlocked" class="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <ShieldAlert class="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p class="text-destructive font-medium text-sm">Cuenta bloqueada temporalmente</p>
            <p class="text-destructive/80 text-xs mt-0.5">Demasiados intentos fallidos. Espera {{ blockTimer }} segundos.</p>
          </div>
        </div>

        <!-- Error Messages -->
        <div v-else-if="error || formError" class="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <ShieldAlert class="h-4 w-4 shrink-0" />
          {{ error || formError }}
        </div>

        <!-- Remaining Attempts Warning -->
        <div v-if="loginAttempts > 2 && loginAttempts < 5 && !isBlocked" class="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm">
          Te quedan {{ 5 - loginAttempts }} intentos antes del bloqueo temporal
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4" autocomplete="off">
          <!-- Email -->
          <div class="space-y-2">
            <Label for="email" class="text-sm font-medium">Correo electronico</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="admin@ejemplo.com"
              autocomplete="username"
              required
              :disabled="isBlocked"
              class="lowercase rounded-lg h-10"
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <Label for="password" class="text-sm font-medium">Contraseña</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                required
                :disabled="isBlocked"
                class="pr-10 rounded-lg h-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                :disabled="isBlocked"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Turnstile captcha -->
          <div class="flex justify-center">
            <TurnstileWidget
              ref="turnstileRef"
              @verify="onTurnstileVerify"
              @expired="onTurnstileExpired"
              @error="onTurnstileExpired"
            />
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            class="w-full rounded-lg h-10"
            :disabled="loading || isBlocked || !turnstileToken"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin mr-2" />
            <ShieldAlert v-else-if="isBlocked" class="h-4 w-4 mr-2" />
            {{ isBlocked ? 'Bloqueado' : 'Iniciar Sesion' }}
          </Button>
        </form>

        <!-- Security Notice -->
        <div class="mt-8 pt-6 border-t border-border">
          <p class="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Lock class="h-3 w-3" />
            Conexion segura. Solo usuarios autorizados.
          </p>
        </div>

      </div>
    </div>

    <!-- Right Side - Decorative -->
    <div class="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-foreground">
      <div class="relative max-w-md text-background px-12">
        <h2 class="text-3xl font-semibold tracking-tight mb-4">
          Panel de Administracion
        </h2>
        <p class="text-background/60 mb-8">
          Gestiona tu portal de noticias de forma segura.
          Publica, edita y administra contenido multimedia.
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-background/10 rounded-lg p-4">
            <Lock class="h-5 w-5 mb-2 text-background/70" />
            <div class="text-background/60 text-sm">Acceso seguro</div>
          </div>
          <div class="bg-background/10 rounded-lg p-4">
            <BarChart3 class="h-5 w-5 mb-2 text-background/70" />
            <div class="text-background/60 text-sm">Control total</div>
          </div>
          <div class="bg-background/10 rounded-lg p-4">
            <Zap class="h-5 w-5 mb-2 text-background/70" />
            <div class="text-background/60 text-sm">Ultra rapido</div>
          </div>
          <div class="bg-background/10 rounded-lg p-4">
            <Shield class="h-5 w-5 mb-2 text-background/70" />
            <div class="text-background/60 text-sm">RLS protegido</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

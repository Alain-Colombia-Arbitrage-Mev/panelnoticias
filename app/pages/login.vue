<script setup lang="ts">
import { Eye, EyeOff, Newspaper, Loader2, ShieldAlert, Lock, BarChart3, Zap, Shield } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const { signIn, loading, error } = usePortalAuth()
const user = useSupabaseUser()

const showPassword = ref(false)
const loginAttempts = ref(0)
const isBlocked = ref(false)
const blockTimer = ref(0)

const form = ref({
  email: '',
  password: '',
})

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

  try {
    const success = await signIn(email, password)

    if (success) {
      loginAttempts.value = 0
      navigateTo('/admin')
    } else {
      loginAttempts.value++

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
    }
  } catch (err) {
    console.error('Error en login:', err)
    formError.value = 'Error al intentar iniciar sesión'
  }
}

const handlePaste = (e: ClipboardEvent) => {
  console.info('[Security] Paste detected in password field')
}

useHead({
  title: 'Iniciar Sesión - Panel de Noticias',
})
</script>

<template>
  <div class="min-h-screen flex bg-background gradient-mesh">
    <!-- Left Side - Form -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="flex items-center gap-3 mb-10">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Newspaper class="h-6 w-6 text-white" />
          </div>
          <span class="font-display text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Panel de Noticias
          </span>
        </div>

        <!-- Title -->
        <div class="mb-8">
          <h1 class="font-display text-3xl font-bold mb-2">
            Acceso Administrativo
          </h1>
          <p class="text-muted-foreground">
            Ingresa tus credenciales para acceder al panel
          </p>
        </div>

        <!-- Blocked Warning -->
        <div v-if="isBlocked" class="mb-6 p-4 rounded-xl glass border-destructive/20 flex items-start gap-3">
          <ShieldAlert class="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p class="text-destructive font-medium text-sm">Cuenta bloqueada temporalmente</p>
            <p class="text-destructive/80 text-xs mt-0.5">Demasiados intentos fallidos. Espera {{ blockTimer }} segundos.</p>
          </div>
        </div>

        <!-- Error Messages -->
        <div v-else-if="error || formError" class="mb-6 p-4 rounded-xl glass border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <ShieldAlert class="h-4 w-4 shrink-0" />
          {{ error || formError }}
        </div>

        <!-- Remaining Attempts Warning -->
        <div v-if="loginAttempts > 2 && loginAttempts < 5 && !isBlocked" class="mb-4 p-3 rounded-xl glass border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm">
          Te quedan {{ 5 - loginAttempts }} intentos antes del bloqueo temporal
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5" autocomplete="off">
          <!-- Email -->
          <div class="space-y-2">
            <Label for="email" class="text-sm font-medium">Correo electrónico</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="admin@ejemplo.com"
              autocomplete="username"
              required
              :disabled="isBlocked"
              class="lowercase rounded-xl h-11"
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
                class="pr-10 rounded-xl h-11"
                @paste="handlePaste"
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

          <!-- Submit Button -->
          <Button type="submit" class="w-full rounded-xl h-11 shadow-lg shadow-primary/20" :disabled="loading || isBlocked">
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin mr-2" />
            <ShieldAlert v-else-if="isBlocked" class="h-4 w-4 mr-2" />
            {{ isBlocked ? 'Bloqueado' : 'Iniciar Sesión' }}
          </Button>
        </form>

        <!-- Security Notice -->
        <div class="mt-8 p-4 rounded-xl glass">
          <p class="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
            <Lock class="h-3.5 w-3.5" />
            Conexión segura. Solo usuarios autorizados pueden acceder.
          </p>
        </div>

      </div>
    </div>

    <!-- Right Side - Decorative -->
    <div class="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-12">
      <!-- Glass background -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-blue-400"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>

      <div class="relative max-w-lg text-white">
        <h2 class="font-display text-4xl font-bold mb-6">
          Panel de Administración
        </h2>
        <p class="text-white/80 text-lg mb-8">
          Gestiona tu portal de noticias de forma segura.
          Publica, edita y administra contenido multimedia.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <Lock class="h-7 w-7 mb-3 text-white/90" />
            <div class="text-white/70 text-sm">Acceso seguro</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <BarChart3 class="h-7 w-7 mb-3 text-white/90" />
            <div class="text-white/70 text-sm">Control total</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <Zap class="h-7 w-7 mb-3 text-white/90" />
            <div class="text-white/70 text-sm">Ultra rápido</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <Shield class="h-7 w-7 mb-3 text-white/90" />
            <div class="text-white/70 text-sm">RLS protegido</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

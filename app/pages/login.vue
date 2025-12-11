<script setup lang="ts">
import { Eye, EyeOff, Newspaper, Loader2, ShieldAlert } from 'lucide-vue-next'

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
      // Reset intentos en login exitoso
      loginAttempts.value = 0
      navigateTo('/admin')
    } else {
      // Incrementar contador de intentos fallidos
      loginAttempts.value++
      
      // Bloquear después de 5 intentos
      if (loginAttempts.value >= 5) {
        isBlocked.value = true
        blockTimer.value = 60 // 60 segundos
        
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

// Prevenir paste en campo de contraseña (opcional, para mayor seguridad)
const handlePaste = (e: ClipboardEvent) => {
  // Permitir paste pero registrar
  console.info('[Security] Paste detected in password field')
}

useHead({
  title: 'Iniciar Sesión - Panel de Noticias',
})
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left Side - Form -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="flex items-center gap-2 mb-8">
          <Newspaper class="h-10 w-10 text-primary" />
          <span class="font-display text-2xl font-bold">Panel de Noticias</span>
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
        <div v-if="isBlocked" class="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <ShieldAlert class="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p class="text-destructive font-medium">Cuenta bloqueada temporalmente</p>
            <p class="text-destructive/80 text-sm">Demasiados intentos fallidos. Espera {{ blockTimer }} segundos.</p>
          </div>
        </div>

        <!-- Error Messages -->
        <div v-else-if="error || formError" class="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {{ error || formError }}
        </div>

        <!-- Remaining Attempts Warning -->
        <div v-if="loginAttempts > 2 && loginAttempts < 5 && !isBlocked" class="mb-4 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm">
          ⚠️ Te quedan {{ 5 - loginAttempts }} intentos antes del bloqueo temporal
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6" autocomplete="off">
          <!-- Email -->
          <div class="space-y-2">
            <Label for="email">Correo electrónico</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="admin@ejemplo.com"
              autocomplete="username"
              required
              :disabled="isBlocked"
              class="lowercase"
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <Label for="password">Contraseña</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                required
                :disabled="isBlocked"
                class="pr-10"
                @paste="handlePaste"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                :disabled="isBlocked"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <Button type="submit" class="w-full" :disabled="loading || isBlocked">
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin mr-2" />
            <ShieldAlert v-else-if="isBlocked" class="h-4 w-4 mr-2" />
            {{ isBlocked ? 'Bloqueado' : 'Iniciar Sesión' }}
          </Button>
        </form>

        <!-- Security Notice -->
        <div class="mt-8 p-4 rounded-lg bg-muted/50 border">
          <p class="text-xs text-muted-foreground text-center">
            🔒 Conexión segura. Solo usuarios autorizados pueden acceder.
          </p>
        </div>

      </div>
    </div>

    <!-- Right Side - Decorative -->
    <div class="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/80 items-center justify-center p-12">
      <div class="max-w-lg text-white">
        <h2 class="font-display text-4xl font-bold mb-6">
          Panel de Administración
        </h2>
        <p class="text-white/80 text-lg mb-8">
          Gestiona tu portal de noticias de forma segura. 
          Publica, edita y administra contenido multimedia.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">🔐</div>
            <div class="text-white/70 text-sm">Acceso seguro</div>
          </div>
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">📊</div>
            <div class="text-white/70 text-sm">Control total</div>
          </div>
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">⚡</div>
            <div class="text-white/70 text-sm">Ultra rápido</div>
          </div>
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">🛡️</div>
            <div class="text-white/70 text-sm">RLS protegido</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


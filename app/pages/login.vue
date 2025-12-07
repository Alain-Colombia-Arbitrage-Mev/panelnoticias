<script setup lang="ts">
import { Eye, EyeOff, Newspaper, Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const { signIn, signUp, loading, error } = usePortalAuth()
const user = useSupabaseUser()

const isLogin = ref(true)
const showPassword = ref(false)

const form = ref({
  email: '',
  password: '',
  fullName: '',
  confirmPassword: '',
})

const formError = ref('')

watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/admin')
  }
}, { immediate: true })

const handleSubmit = async () => {
  formError.value = ''

  if (!form.value.email || !form.value.password) {
    formError.value = 'Por favor completa todos los campos'
    return
  }

  if (!isLogin.value) {
    if (form.value.password !== form.value.confirmPassword) {
      formError.value = 'Las contraseñas no coinciden'
      return
    }
    if (form.value.password.length < 8) {
      formError.value = 'La contraseña debe tener al menos 8 caracteres'
      return
    }
  }

  if (isLogin.value) {
    const success = await signIn(form.value.email, form.value.password)
    if (success) {
      navigateTo('/admin')
    }
  } else {
    const success = await signUp(form.value.email, form.value.password, form.value.fullName)
    if (success) {
      formError.value = ''
      isLogin.value = true
      form.value = { email: form.value.email, password: '', fullName: '', confirmPassword: '' }
    }
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  formError.value = ''
  form.value.password = ''
  form.value.confirmPassword = ''
}

useHead({
  title: isLogin.value ? 'Iniciar Sesión' : 'Registrarse',
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
            {{ isLogin ? 'Bienvenido de vuelta' : 'Crear cuenta' }}
          </h1>
          <p class="text-muted-foreground">
            {{ isLogin ? 'Ingresa tus credenciales para acceder al panel' : 'Completa el formulario para registrarte' }}
          </p>
        </div>

        <!-- Error Messages -->
        <div v-if="error || formError" class="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {{ error || formError }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Full Name (only for register) -->
          <div v-if="!isLogin" class="space-y-2">
            <Label for="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              v-model="form.fullName"
              type="text"
              placeholder="Juan Pérez"
              autocomplete="name"
            />
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <Label for="email">Correo electrónico</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              autocomplete="email"
              required
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
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Confirm Password (only for register) -->
          <div v-if="!isLogin" class="space-y-2">
            <Label for="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </div>

          <!-- Submit Button -->
          <Button type="submit" class="w-full" :disabled="loading">
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin mr-2" />
            {{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}
          </Button>
        </form>

        <!-- Toggle Mode -->
        <p class="mt-6 text-center text-sm text-muted-foreground">
          {{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
          <button
            type="button"
            class="text-primary hover:underline font-medium ml-1"
            @click="toggleMode"
          >
            {{ isLogin ? 'Regístrate' : 'Inicia Sesión' }}
          </button>
        </p>

      </div>
    </div>

    <!-- Right Side - Decorative -->
    <div class="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/80 items-center justify-center p-12">
      <div class="max-w-lg text-white">
        <h2 class="font-display text-4xl font-bold mb-6">
          Gestiona tu portal de noticias
        </h2>
        <p class="text-white/80 text-lg mb-8">
          Publica, edita y administra tus noticias de forma rápida y sencilla. 
          Sube imágenes, videos y audios para enriquecer tu contenido.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">∞</div>
            <div class="text-white/70 text-sm">Noticias ilimitadas</div>
          </div>
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">📁</div>
            <div class="text-white/70 text-sm">Multimedia incluida</div>
          </div>
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">⚡</div>
            <div class="text-white/70 text-sm">Ultra rápido</div>
          </div>
          <div class="bg-white/10 rounded-lg p-4">
            <div class="text-3xl font-bold mb-1">🔒</div>
            <div class="text-white/70 text-sm">Seguro</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


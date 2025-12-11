import type { Usuario } from '~/types/database'

export const usePortalAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const portalUser = ref<Usuario | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAdmin = computed(() => portalUser.value?.role === 'admin')
  const isEditor = computed(() => portalUser.value?.role === 'editor' || isAdmin.value)
  const isAuthor = computed(() => portalUser.value?.role === 'author' || isEditor.value)

  const fetchPortalUser = async () => {
    if (!user.value) {
      portalUser.value = null
      return null
    }

    loading.value = true
    error.value = null

    try {
      // Buscar usuario por email (que coincide con el email de auth)
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', user.value.email)
        .single()

      if (fetchError) {
        // SEGURIDAD: Si no existe en la tabla usuarios, NO crear automáticamente
        // El usuario debe ser creado manualmente por un admin
        if (fetchError.code === 'PGRST116') {
          console.warn('[Security] Usuario autenticado pero no autorizado:', user.value.email)
          // Cerrar sesión para prevenir acceso no autorizado
          await supabase.auth.signOut()
          error.value = 'Usuario no autorizado. Contacta al administrador.'
          return null
        }
        throw fetchError
      }

      portalUser.value = data as Usuario
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching portal user:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    // Sanitizar email
    const sanitizedEmail = email.trim().toLowerCase()

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      })

      if (signInError) {
        // Mensajes de error genéricos para no revelar información
        error.value = 'Credenciales inválidas'
        return false
      }

      if (data.user) {
        // Verificar que existe en la tabla usuarios ANTES de permitir acceso
        const { data: portalData, error: portalError } = await supabase
          .from('usuarios')
          .select('id, email, role')
          .eq('email', sanitizedEmail)
          .single()

        if (portalError || !portalData) {
          // Usuario existe en Auth pero NO en usuarios - cerrar sesión
          console.warn('[Security] Intento de acceso no autorizado:', sanitizedEmail)
          await supabase.auth.signOut()
          error.value = 'Usuario no autorizado para acceder al panel'
          return false
        }

        // Usuario válido - cargar datos completos
        await fetchPortalUser()
      }

      return true
    } catch (err: any) {
      error.value = 'Error al iniciar sesión'
      console.error('[Security] Login error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // DESHABILITADO: El registro público está desactivado por seguridad
  // Los usuarios deben ser creados manualmente por un administrador
  const signUp = async (_email: string, _password: string, _fullName?: string) => {
    error.value = 'El registro público está deshabilitado. Contacta al administrador.'
    console.warn('[Security] Intento de registro público bloqueado')
    return false
  }

  const signOut = async () => {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      portalUser.value = null
      navigateTo('/login')
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: Partial<Usuario>) => {
    if (!portalUser.value) return null

    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', portalUser.value.id)
        .select()
        .single()

      if (updateError) throw updateError

      portalUser.value = data as Usuario
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  // Observar cambios en el usuario de auth
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchPortalUser()
    } else {
      portalUser.value = null
    }
  }, { immediate: true })

  return {
    portalUser,
    loading,
    error,
    isAdmin,
    isEditor,
    isAuthor,
    fetchPortalUser,
    signIn,
    signOut,
    updateProfile,
  }
}

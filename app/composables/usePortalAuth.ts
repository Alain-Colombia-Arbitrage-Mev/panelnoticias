import type { Usuario } from '~/types/database'

export const usePortalAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const portalUser = ref<Usuario | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAdmin = computed(() => portalUser.value?.role === 'admin')
  const isEditor = computed(() => portalUser.value?.role === 'editor' || isAdmin.value)

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
        // Si no existe, intentar crear el usuario
        if (fetchError.code === 'PGRST116') {
          const newUser = await createPortalUser(user.value.email!, user.value.user_metadata?.full_name)
          portalUser.value = newUser
          return newUser
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

  const createPortalUser = async (email: string, name?: string) => {
    try {
      const { data, error: createError } = await supabase
        .from('usuarios')
        .insert({
          email,
          name: name || email.split('@')[0],
          role: 'author',
        })
        .select()
        .single()

      if (createError) throw createError

      return data as Usuario
    } catch (err: any) {
      console.error('Error creating portal user:', err)
      return null
    }
  }

  const signIn = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        await fetchPortalUser()
      }

      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      // Crear usuario en la tabla usuarios
      if (data.user) {
        await supabase.from('usuarios').insert({
          email,
          name: fullName || email.split('@')[0],
          role: 'author',
        })
      }

      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
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
    fetchPortalUser,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }
}

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // Primero verificar autenticación básica
  if (!user.value) {
    return navigateTo('/login')
  }

  try {
    const { data: portalUser, error } = await supabase
      .from('usuarios')
      .select('id, email, role')
      .eq('email', user.value.email)
      .single()

    if (error || !portalUser) {
      await supabase.auth.signOut()
      return navigateTo('/login')
    }

    // Solo admins pueden acceder
    if (portalUser.role !== 'admin') {
      console.error('Acceso denegado: se requiere rol admin')
      return navigateTo('/admin')
    }

  } catch (err) {
    console.error('Error verificando permisos de admin:', err)
    return navigateTo('/login')
  }
})

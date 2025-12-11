export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // Verificar si hay sesión de Supabase Auth
  if (!user.value) {
    return navigateTo('/login')
  }

  // Verificar que el usuario existe en la tabla usuarios y tiene permisos
  try {
    const { data: portalUser, error } = await supabase
      .from('usuarios')
      .select('id, email, role')
      .eq('email', user.value.email)
      .single()

    // Si no existe en la tabla usuarios o hay error, denegar acceso
    if (error || !portalUser) {
      console.error('Usuario no autorizado:', user.value.email)
      // Cerrar sesión para evitar acceso con cuenta no registrada
      await supabase.auth.signOut()
      return navigateTo('/login')
    }

    // Verificar que tiene rol válido para acceder al admin
    const allowedRoles = ['admin', 'editor', 'author']
    if (!allowedRoles.includes(portalUser.role)) {
      console.error('Rol no autorizado:', portalUser.role)
      return navigateTo('/login')
    }

  } catch (err) {
    console.error('Error verificando usuario:', err)
    return navigateTo('/login')
  }
})


import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Obtener token del header
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Token de autenticación requerido'
    })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  // Crear cliente de Supabase
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )
  
  try {
    // Verificar token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw createError({
        statusCode: 401,
        message: 'Token inválido o expirado'
      })
    }
    
    // Verificar que el usuario existe en la tabla usuarios
    const { data: portalUser, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, role, name')
      .eq('email', user.email)
      .single()
    
    if (userError || !portalUser) {
      throw createError({
        statusCode: 403,
        message: 'Usuario no autorizado'
      })
    }
    
    return {
      valid: true,
      user: {
        id: portalUser.id,
        email: portalUser.email,
        name: portalUser.name,
        role: portalUser.role
      }
    }
    
  } catch (err: any) {
    if (err.statusCode) throw err
    
    throw createError({
      statusCode: 500,
      message: 'Error verificando sesión'
    })
  }
})

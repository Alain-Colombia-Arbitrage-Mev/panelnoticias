import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, message: 'ID de usuario requerido' })
  }

  // Crear cliente admin con service_role_key
  const supabaseAdmin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Verificar que el solicitante es admin
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'No autorizado' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !authUser) {
    throw createError({ statusCode: 401, message: 'Token inválido' })
  }

  // Verificar rol admin
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from('usuarios')
    .select('id, role')
    .eq('email', authUser.email)
    .single()

  if (adminError || !adminUser || adminUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden eliminar usuarios' })
  }

  // No permitir auto-eliminación
  if (adminUser.id === userId) {
    throw createError({ statusCode: 400, message: 'No puedes eliminarte a ti mismo' })
  }

  try {
    // Obtener el usuario a eliminar para encontrar su auth_user_id
    const { data: userToDelete, error: fetchError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (fetchError || !userToDelete) {
      throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
    }

    // Buscar el auth user por email para eliminarlo
    const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) throw listError

    const authUserToDelete = authUsers?.find(u => u.email === userToDelete.email)

    // Eliminar de la tabla usuarios
    const { error: deleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', userId)

    if (deleteError) throw deleteError

    // Eliminar de Supabase Auth
    if (authUserToDelete) {
      await supabaseAdmin.auth.admin.deleteUser(authUserToDelete.id)
    }

    console.info(`[ADMIN] User deleted: ${userToDelete.email} by admin ${authUser.email}`)

    return { success: true }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('[ADMIN] Error deleting user:', err.message)
    throw createError({
      statusCode: 500,
      message: 'Error al eliminar el usuario',
    })
  }
})

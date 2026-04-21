import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, message: 'ID de usuario requerido' })
  }

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

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'No autorizado' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !authUser) {
    throw createError({ statusCode: 401, message: 'Token inválido' })
  }

  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from('usuarios')
    .select('id, role')
    .eq('email', authUser.email)
    .single()

  if (adminError || !adminUser || adminUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden actualizar usuarios' })
  }

  const body = await readBody(event)
  const { name, role, is_active } = body ?? {}

  const updates: Record<string, unknown> = {}

  if (typeof name === 'string') {
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      throw createError({ statusCode: 400, message: 'El nombre no puede estar vacío' })
    }
    updates.name = trimmed
  }

  if (typeof role !== 'undefined') {
    const validRoles = ['admin', 'editor', 'viewer']
    if (!validRoles.includes(role)) {
      throw createError({ statusCode: 400, message: 'Rol inválido. Opciones: admin, editor, viewer' })
    }
    updates.role = role
  }

  if (typeof is_active !== 'undefined') {
    if (typeof is_active !== 'boolean') {
      throw createError({ statusCode: 400, message: 'is_active debe ser booleano' })
    }
    if (adminUser.id === userId && is_active === false) {
      throw createError({ statusCode: 400, message: 'No puedes desactivarte a ti mismo' })
    }
    updates.is_active = is_active
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No hay cambios para aplicar' })
  }

  if (adminUser.id === userId && typeof role !== 'undefined' && role !== 'admin') {
    throw createError({ statusCode: 400, message: 'No puedes cambiar tu propio rol' })
  }

  try {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) throw updateError

    if (!updated) {
      throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
    }

    console.info(`[ADMIN] User updated: ${updated.email} by admin ${authUser.email}`)

    return { success: true, user: updated }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('[ADMIN] Error updating user:', err.message)
    throw createError({
      statusCode: 500,
      message: 'Error al actualizar el usuario: ' + err.message,
    })
  }
})

import { createClient } from '@supabase/supabase-js'
import { validatePasswordStrength, isPasswordPwned } from '../../../utils/password'

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
  const { name, role, is_active, password } = body ?? {}

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

  let passwordToApply: string | undefined
  if (typeof password !== 'undefined' && password !== null && password !== '') {
    const strength = validatePasswordStrength(password)
    if (!strength.ok) {
      throw createError({ statusCode: 400, message: strength.message })
    }
    if (await isPasswordPwned(password)) {
      throw createError({
        statusCode: 400,
        message: 'Esta contraseña apareció en filtraciones públicas. Usa otra.',
      })
    }
    passwordToApply = password
  }

  if (Object.keys(updates).length === 0 && !passwordToApply) {
    throw createError({ statusCode: 400, message: 'No hay cambios para aplicar' })
  }

  if (adminUser.id === userId && typeof role !== 'undefined' && role !== 'admin') {
    throw createError({ statusCode: 400, message: 'No puedes cambiar tu propio rol' })
  }

  try {
    let updatedRow: any = null

    if (Object.keys(updates).length > 0) {
      const { data, error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError
      if (!data) {
        throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
      }
      updatedRow = data
    } else {
      const { data, error: fetchError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError || !data) {
        throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
      }
      updatedRow = data
    }

    if (passwordToApply) {
      const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError

      const authTarget = authUsers?.find(u => u.email === updatedRow.email)
      if (!authTarget) {
        throw createError({ statusCode: 404, message: 'Usuario no encontrado en autenticación' })
      }

      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(authTarget.id, {
        password: passwordToApply,
      })
      if (pwError) throw pwError

      console.info(`[ADMIN] Password reset for ${updatedRow.email} by admin ${authUser.email}`)
    }

    console.info(`[ADMIN] User updated: ${updatedRow.email} by admin ${authUser.email}`)

    return { success: true, user: updatedRow }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('[ADMIN] Error updating user:', err.message)
    throw createError({
      statusCode: 500,
      message: 'Error al actualizar el usuario: ' + err.message,
    })
  }
})

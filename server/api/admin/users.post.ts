import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

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

  // Verificar rol admin en la tabla usuarios
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from('usuarios')
    .select('id, role')
    .eq('email', authUser.email)
    .single()

  if (adminError || !adminUser || adminUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden crear usuarios' })
  }

  // Leer datos del body
  const body = await readBody(event)
  const { email, password, role } = body

  // Validaciones
  if (!email || !password || !role) {
    throw createError({ statusCode: 400, message: 'Email, contraseña y rol son requeridos' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, message: 'Formato de email inválido' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, message: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const validRoles = ['admin', 'editor', 'viewer']
  if (!validRoles.includes(role)) {
    throw createError({ statusCode: 400, message: 'Rol inválido. Opciones: admin, editor, viewer' })
  }

  try {
    // Crear usuario en Supabase Auth
    const { data: newAuthUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authCreateError) {
      if (authCreateError.message?.includes('already been registered')) {
        throw createError({ statusCode: 409, message: 'Este email ya está registrado' })
      }
      throw authCreateError
    }

    if (!newAuthUser.user) {
      throw new Error('No se pudo crear el usuario en Auth')
    }

    // Generar username del email
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '')

    // Insertar en tabla usuarios
    const { data: portalUser, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email: newAuthUser.user.email,
        name: username,
        role,
        avatar_url: null,
      })
      .select()
      .single()

    if (insertError) {
      // Rollback: eliminar usuario de Auth si falla la inserción en la tabla
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id)
      throw insertError
    }

    console.info(`[ADMIN] User created: ${email} (${role}) by admin ${authUser.email}`)

    return {
      success: true,
      user: portalUser,
    }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('[ADMIN] Error creating user:', err.message)
    throw createError({
      statusCode: 500,
      message: 'Error al crear el usuario: ' + err.message,
    })
  }
})

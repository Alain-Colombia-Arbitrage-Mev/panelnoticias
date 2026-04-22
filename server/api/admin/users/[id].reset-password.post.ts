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
    throw createError({ statusCode: 403, message: 'Solo administradores pueden enviar links de reset' })
  }

  const { data: target, error: fetchError } = await supabaseAdmin
    .from('usuarios')
    .select('email')
    .eq('id', userId)
    .single()

  if (fetchError || !target) {
    throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
  }

  const origin = getRequestURL(event).origin

  const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(target.email, {
    redirectTo: `${origin}/login?reset=1`,
  })

  if (resetError) {
    console.error('[ADMIN] Error sending reset link:', resetError.message)
    throw createError({
      statusCode: 500,
      message: 'No se pudo enviar el link de reset: ' + resetError.message,
    })
  }

  console.info(`[ADMIN] Password reset link sent to ${target.email} by admin ${authUser.email}`)

  return { success: true, email: target.email }
})

import { createClient } from '@supabase/supabase-js'

// Rate limiting simple en memoria (en producción usar Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutos
const ATTEMPT_WINDOW = 5 * 60 * 1000 // 5 minutos

function getClientIP(event: any): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIP = getHeader(event, 'x-real-ip')
  const cfIP = getHeader(event, 'cf-connecting-ip')
  
  return cfIP || realIP || forwarded?.split(',')[0]?.trim() || 'unknown'
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; blockedUntil?: number } {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }
  
  // Si está bloqueado, verificar si ya pasó el tiempo
  if (record.blocked) {
    const blockedUntil = record.lastAttempt + BLOCK_DURATION
    if (now < blockedUntil) {
      return { allowed: false, remainingAttempts: 0, blockedUntil }
    }
    // Desbloquear
    loginAttempts.delete(ip)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }
  
  // Limpiar intentos antiguos
  if (now - record.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(ip)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }
  
  return { 
    allowed: record.count < MAX_ATTEMPTS, 
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.count) 
  }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  
  if (!record) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now, blocked: false })
    return
  }
  
  record.count++
  record.lastAttempt = now
  
  if (record.count >= MAX_ATTEMPTS) {
    record.blocked = true
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const ip = getClientIP(event)
  
  // Verificar rate limiting
  const rateLimit = checkRateLimit(ip)
  if (!rateLimit.allowed) {
    const waitTime = rateLimit.blockedUntil 
      ? Math.ceil((rateLimit.blockedUntil - Date.now()) / 1000 / 60)
      : 15
    
    throw createError({
      statusCode: 429,
      message: `Demasiados intentos de login. Intenta de nuevo en ${waitTime} minutos.`
    })
  }
  
  const body = await readBody(event)
  const { email, password } = body
  
  // Validaciones básicas
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email y contraseña son requeridos'
    })
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      message: 'Formato de email inválido'
    })
  }
  
  // Crear cliente de Supabase
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )
  
  try {
    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      // Registrar intento fallido
      recordFailedAttempt(ip)
      
      // Log de seguridad
      console.warn(`[SECURITY] Failed login attempt for ${email} from IP ${ip}`)
      
      throw createError({
        statusCode: 401,
        message: 'Credenciales inválidas'
      })
    }
    
    // Verificar que el usuario existe en la tabla usuarios
    const { data: portalUser, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, role, name')
      .eq('email', email)
      .single()
    
    if (userError || !portalUser) {
      // Cerrar sesión si no está en la tabla usuarios
      await supabase.auth.signOut()
      
      console.warn(`[SECURITY] User ${email} not in usuarios table, access denied from IP ${ip}`)
      
      throw createError({
        statusCode: 403,
        message: 'Usuario no autorizado para acceder al panel'
      })
    }
    
    // Login exitoso - limpiar intentos
    clearAttempts(ip)
    
    // Log de acceso exitoso
    console.info(`[SECURITY] Successful login for ${email} (${portalUser.role}) from IP ${ip}`)
    
    // Registrar en tabla de auditoría (si existe)
    try {
      await supabase.from('audit_logs').insert({
        user_id: portalUser.id,
        action: 'login',
        ip_address: ip,
        user_agent: getHeader(event, 'user-agent'),
        details: { email, role: portalUser.role }
      })
    } catch {
      // Ignorar si la tabla no existe
    }
    
    return {
      success: true,
      user: {
        id: portalUser.id,
        email: portalUser.email,
        name: portalUser.name,
        role: portalUser.role
      },
      session: data.session
    }
    
  } catch (err: any) {
    if (err.statusCode) throw err
    
    console.error(`[SECURITY] Login error for ${email}:`, err.message)
    
    throw createError({
      statusCode: 500,
      message: 'Error interno del servidor'
    })
  }
})

export default defineEventHandler((event) => {
  // Solo aplicar a respuestas HTML
  const url = getRequestURL(event)
  
  // Headers de seguridad
  setHeaders(event, {
    // Prevenir clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevenir MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Habilitar XSS protection del navegador
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Content Security Policy básica
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self' https://*.supabase.co blob:",
      "frame-ancestors 'none'"
    ].join('; ')
  })
})

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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://api.pwnedpasswords.com",
      "media-src 'self' https://*.supabase.co blob:",
      "frame-src 'self' https://challenges.cloudflare.com",
      "frame-ancestors 'none'"
    ].join('; ')
  })
})

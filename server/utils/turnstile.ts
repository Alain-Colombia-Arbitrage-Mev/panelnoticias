interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  action?: string
  hostname?: string
}

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
): Promise<{ ok: boolean; message?: string }> {
  const secret = useRuntimeConfig().turnstileSecretKey as string | undefined

  if (!secret) {
    return { ok: false, message: 'Captcha no configurado en el servidor' }
  }

  if (!token) {
    return { ok: false, message: 'Captcha requerido' }
  }

  const params = new URLSearchParams()
  params.append('secret', secret)
  params.append('response', token)
  if (remoteIp) params.append('remoteip', remoteIp)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!res.ok) {
      return { ok: false, message: 'Error validando captcha' }
    }

    const data = (await res.json()) as TurnstileResponse

    if (!data.success) {
      console.warn('[SECURITY] Turnstile verification failed:', data['error-codes'])
      return { ok: false, message: 'Captcha inválido. Intenta de nuevo.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('[SECURITY] Turnstile verify error:', err)
    return { ok: false, message: 'Error validando captcha' }
  }
}

const COMMON_PASSWORDS = new Set([
  'password', 'passw0rd', 'admin1234', 'qwerty123', '12345678', '123456789',
  '1234567890', 'contraseña', 'administrador', 'welcome1', 'letmein123',
  'abcdef123', 'iloveyou1', 'monkey123', 'dragon123', 'master123',
])

export interface PasswordCheckResult {
  ok: boolean
  message?: string
}

export function validatePasswordStrength(password: unknown): PasswordCheckResult {
  if (typeof password !== 'string') {
    return { ok: false, message: 'La contraseña debe ser texto' }
  }

  if (password.length < 12) {
    return { ok: false, message: 'La contraseña debe tener al menos 12 caracteres' }
  }

  if (password.length > 128) {
    return { ok: false, message: 'La contraseña es demasiado larga (máx 128)' }
  }

  if (!/[a-z]/.test(password)) {
    return { ok: false, message: 'La contraseña debe incluir al menos una minúscula' }
  }

  if (!/[A-Z]/.test(password)) {
    return { ok: false, message: 'La contraseña debe incluir al menos una mayúscula' }
  }

  if (!/[0-9]/.test(password)) {
    return { ok: false, message: 'La contraseña debe incluir al menos un número' }
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, message: 'La contraseña debe incluir al menos un símbolo' }
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, message: 'Esta contraseña es demasiado común' }
  }

  return { ok: true }
}

async function sha1Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-1', buf)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const hash = await sha1Hex(password)
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })

    if (!res.ok) return false

    const text = await res.text()
    return text.split('\n').some(line => {
      const [hashSuffix] = line.trim().split(':')
      return hashSuffix === suffix
    })
  } catch {
    return false
  }
}

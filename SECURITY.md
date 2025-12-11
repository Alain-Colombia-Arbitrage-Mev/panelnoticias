# 🔐 Guía de Seguridad

## Variables de Entorno

### ⚠️ NUNCA subas estos archivos al repositorio:
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- Cualquier archivo que contenga `SUPABASE_SERVICE_ROLE_KEY`

### ✅ Archivos seguros para subir:
- `.env.example` (sin valores reales)
- `.gitignore` (configurado correctamente)

## Verificación Pre-Push

Antes de hacer push, verifica:

1. **No hay archivos .env en staging:**
```bash
git status | grep -E "\.env$|\.env\."
```

2. **No hay claves hardcodeadas:**
```bash
grep -r "SUPABASE_SERVICE_ROLE_KEY" --exclude-dir=node_modules --exclude=".env.example" .
```

3. **El .gitignore está actualizado:**
```bash
cat .gitignore | grep "\.env"
```

## Rotación de Claves

Si accidentalmente expusiste una clave:

1. **Inmediatamente** rota la clave en Supabase Dashboard
2. **Elimina** el commit del historial (si es necesario)
3. **Actualiza** todas las instancias con la nueva clave

## Configuración de GitHub Secrets

Para CI/CD, usa GitHub Secrets:

1. Ve a Settings > Secrets and variables > Actions
2. Agrega:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo si es necesario para CI)

## Checklist de Seguridad

- [ ] `.env` está en `.gitignore`
- [ ] `.env.example` no contiene valores reales
- [ ] No hay claves hardcodeadas en el código
- [ ] Las claves de producción son diferentes a las de desarrollo
- [ ] Las políticas RLS están configuradas correctamente
- [ ] El token de GitHub no está en el código


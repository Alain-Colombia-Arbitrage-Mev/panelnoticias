-- =====================================================================
-- Endurecimiento de RLS — 2026-04-21
-- Aplicar en Supabase SQL Editor (o vía `supabase db push`).
-- Objetivo: cerrar escritura/lectura anónima en tablas sensibles,
-- preservando el acceso público de sólo lectura al portal de noticias.
-- =====================================================================

BEGIN;

-- ------------------------------------------------------------------
-- Helper: is_admin(jwt) — SECURITY DEFINER, evita "permission denied
-- for table users" y corta recursión de RLS al consultar usuarios.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.email = (auth.jwt() ->> 'email')
      AND u.role  = 'admin'
      AND COALESCE(u.is_active, true) = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ==================================================================
-- audit_logs
-- Antes: anon podía INSERT. Cualquiera inyectaba registros.
-- Ahora: sólo service_role escribe (via endpoints del servidor).
-- Sólo admins leen.
-- ==================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs anon insert"            ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs authenticated insert"   ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs public select"          ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs select auth"            ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs admin read"             ON public.audit_logs;
-- Política antigua posible (nombre desconocido): limpiar todo.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' LOOP
    EXECUTE format('DROP POLICY %I ON public.audit_logs', p.policyname);
  END LOOP;
END$$;

CREATE POLICY "audit_logs admin read"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Nada de INSERT/UPDATE/DELETE para anon ni authenticated: sólo
-- service_role puede escribir (bypass de RLS). Eso basta porque el
-- login ya se registra desde server/api/auth/login.post.ts con JWT
-- de usuario; para cerrar ese ruteo, moverlo también a service_role
-- o a un endpoint server-side dedicado.

-- Purga de registros basura insertados durante el audit.
DELETE FROM public.audit_logs WHERE action IN ('x','spam');

-- ==================================================================
-- usuarios
-- Antes: SELECT anon devolvía emails/roles; UPDATE fallaba con
-- "permission denied for table users"; DELETE anon 204.
-- Ahora: sólo usuarios autenticados leen la tabla; sólo admins
-- escriben (y nosotros lo hacemos via service_role en endpoints).
-- ==================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='usuarios' LOOP
    EXECUTE format('DROP POLICY %I ON public.usuarios', p.policyname);
  END LOOP;
END$$;

-- Lectura: sólo authenticated (para que el panel muestre la lista).
CREATE POLICY "usuarios select authenticated"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

-- Auto-lectura: el usuario puede verse a sí mismo (para login flow
-- que corre con la key anon antes de obtener JWT, si hiciera falta).
CREATE POLICY "usuarios select self by email"
  ON public.usuarios FOR SELECT
  TO anon, authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- Escritura: sólo admins vía policy (además el código usa service_role
-- en los endpoints, así que este es el cinturón de seguridad).
CREATE POLICY "usuarios admin write"
  ON public.usuarios FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================================================================
-- noticias / categorias / tags / noticias_tags
-- El portal público es de SOLO LECTURA con anon. Las escrituras
-- ocurren desde el panel admin (authenticated) o tareas server.
-- Antes: anon podía emitir DELETE/UPDATE y recibir 204 (silent
-- success sin afectar filas si la policy USING daba false, pero
-- la ambigüedad enmascara intentos y rompe auditoría).
-- Ahora: anon sólo SELECT; authenticated escribe; admins borran.
-- ==================================================================

-- ---- noticias ----
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='noticias' LOOP
    EXECUTE format('DROP POLICY %I ON public.noticias', p.policyname);
  END LOOP;
END$$;

CREATE POLICY "noticias public read published"
  ON public.noticias FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "noticias authenticated read all"
  ON public.noticias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "noticias authenticated insert"
  ON public.noticias FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "noticias authenticated update"
  ON public.noticias FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "noticias admin delete"
  ON public.noticias FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---- categorias ----
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='categorias' LOOP
    EXECUTE format('DROP POLICY %I ON public.categorias', p.policyname);
  END LOOP;
END$$;

CREATE POLICY "categorias public read"
  ON public.categorias FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "categorias admin write"
  ON public.categorias FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- tags ----
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='tags' LOOP
    EXECUTE format('DROP POLICY %I ON public.tags', p.policyname);
  END LOOP;
END$$;

CREATE POLICY "tags public read"
  ON public.tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "tags authenticated write"
  ON public.tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---- noticias_tags ----
ALTER TABLE public.noticias_tags ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='noticias_tags' LOOP
    EXECUTE format('DROP POLICY %I ON public.noticias_tags', p.policyname);
  END LOOP;
END$$;

CREATE POLICY "noticias_tags public read"
  ON public.noticias_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "noticias_tags authenticated write"
  ON public.noticias_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==================================================================
-- Tablas adicionales expuestas (orders, payment_methods, tickets,
-- events): bloquear anon por defecto. Si el sitio público no las
-- consume, no pasa nada; si alguna flujo las necesita, abrir policy
-- específica después.
-- ==================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['orders','payment_methods','tickets','events']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- Purgar policies existentes
    DECLARE p record;
    BEGIN
      FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
      END LOOP;
    END;
    -- Sólo authenticated puede leer/escribir por ahora.
    EXECUTE format($f$
      CREATE POLICY "%1$s authenticated read"
        ON public.%1$I FOR SELECT
        TO authenticated
        USING (true)
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "%1$s admin write"
        ON public.%1$I FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin())
    $f$, t);
  END LOOP;
END$$;

COMMIT;

-- =====================================================================
-- Verificación rápida tras aplicar:
--   1.  curl -H "apikey: $ANON" .../rest/v1/usuarios   -> []  (403 si RLS estricta)
--   2.  curl -X POST -H "apikey: $ANON" .../rest/v1/audit_logs -d '{"action":"x"}' -> 401
--   3.  curl -X DELETE -H "apikey: $ANON" .../rest/v1/noticias?id=eq.<id_real> -> 0 filas afectadas
--   4.  El panel admin sigue viendo/editando/borrando usuarios igual
--       (porque los endpoints /api/admin/users* usan service_role).
-- =====================================================================

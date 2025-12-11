-- =============================================
-- CONFIGURACIÓN DE LÍMITES DE STORAGE EN SUPABASE
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Nota: Supabase Storage tiene límites por defecto que pueden variar según el plan.
-- Los límites configurados en el código de la aplicación son:
-- - Imágenes: 10MB
-- - Videos: 100MB  
-- - Audios: 50MB

-- =============================================
-- POLÍTICAS DE STORAGE PARA VALIDACIÓN DE TAMAÑO
-- =============================================

-- Estas políticas se aplican a nivel de aplicación, pero puedes crear
-- funciones de validación en PostgreSQL si lo deseas.

-- Función para validar tamaño de archivo (opcional, para uso en triggers)
CREATE OR REPLACE FUNCTION validate_file_size(
  file_size_bytes BIGINT,
  max_size_mb INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (file_size_bytes <= (max_size_mb * 1024 * 1024));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CONFIGURACIÓN DE BUCKETS (si no existen)
-- =============================================

-- Nota: Los buckets se crean desde el Dashboard de Supabase o mediante la API.
-- Asegúrate de que estos buckets existan:
-- - 'noticias' (para imágenes)
-- - 'news-videos' (para videos)
-- - 'news-audios' (para audios)

-- =============================================
-- POLÍTICAS RLS PARA STORAGE
-- =============================================

-- Las políticas de Storage se configuran desde el Dashboard de Supabase:
-- 1. Ve a Storage en el Dashboard
-- 2. Selecciona cada bucket
-- 3. Ve a la pestaña "Policies"
-- 4. Crea políticas que permitan:
--    - SELECT: Para usuarios autenticados (ver archivos)
--    - INSERT: Para usuarios autenticados (subir archivos)
--    - UPDATE: Para usuarios autenticados (actualizar archivos)
--    - DELETE: Para usuarios autenticados (eliminar archivos)

-- Ejemplo de política SQL para Storage (ejecutar desde Dashboard):
-- 
-- Para INSERT (subir archivos):
-- CREATE POLICY "Authenticated users can upload files"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'noticias' OR 
--   bucket_id = 'news-videos' OR 
--   bucket_id = 'news-audios'
-- );
--
-- Para SELECT (ver archivos):
-- CREATE POLICY "Authenticated users can view files"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'noticias' OR 
--   bucket_id = 'news-videos' OR 
--   bucket_id = 'news-audios'
-- );
--
-- Para DELETE (eliminar archivos):
-- CREATE POLICY "Authenticated users can delete files"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'noticias' OR 
--   bucket_id = 'news-videos' OR 
--   bucket_id = 'news-audios'
-- );

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================

-- 1. Límites de Supabase por plan:
--    - Free: 1GB de storage total
--    - Pro: 100GB de storage total
--    - Team: Storage ilimitado
--
-- 2. Límites de tamaño de archivo individual:
--    - Por defecto, Supabase permite archivos de hasta 50MB en el plan Free
--    - En planes superiores, el límite puede ser mayor
--    - Para archivos mayores a 50MB, considera usar chunked uploads
--
-- 3. Para aumentar los límites de tamaño de archivo:
--    - Ve al Dashboard de Supabase
--    - Settings > Storage
--    - Verifica los límites configurados
--    - Si necesitas aumentar más allá de 50MB, contacta con soporte o
--      considera usar un servicio de CDN como Cloudflare R2 o AWS S3
--
-- 4. Verificación de límites actuales:
--    Puedes verificar los límites ejecutando en el SQL Editor:
--    SELECT * FROM storage.buckets;

-- =============================================
-- FIN DE LA CONFIGURACIÓN
-- =============================================


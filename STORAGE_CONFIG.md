# Configuración de Storage en Supabase

## Límites de Archivos Configurados

Los límites de tamaño de archivo están configurados en el código de la aplicación:

- **Imágenes**: 10MB máximo
- **Videos**: 100MB máximo
- **Audios**: 50MB máximo

## Configuración en Supabase Dashboard

### 1. Verificar Límites del Plan

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** > **Storage**
3. Revisa los límites de tu plan:
   - **Free**: 1GB total, ~50MB por archivo
   - **Pro**: 100GB total, límites más altos
   - **Team**: Storage ilimitado

### 2. Crear Buckets (si no existen)

1. Ve a **Storage** en el menú lateral
2. Crea los siguientes buckets si no existen:
   - `noticias` (para imágenes)
   - `news-videos` (para videos)
   - `news-audios` (para audios)

### 3. Configurar Políticas de Storage

Para cada bucket, configura las políticas RLS:

#### Política de INSERT (Subir archivos)
```sql
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'noticias' OR 
  bucket_id = 'news-videos' OR 
  bucket_id = 'news-audios'
);
```

#### Política de SELECT (Ver archivos)
```sql
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'noticias' OR 
  bucket_id = 'news-videos' OR 
  bucket_id = 'news-audios'
);
```

#### Política de DELETE (Eliminar archivos)
```sql
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'noticias' OR 
  bucket_id = 'news-videos' OR 
  bucket_id = 'news-audios'
);
```

### 4. Aumentar Límites de Tamaño

Si necesitas aumentar los límites más allá de lo que permite tu plan:

1. **Opción 1**: Actualizar a un plan superior
   - Ve a **Settings** > **Billing**
   - Actualiza tu plan si es necesario

2. **Opción 2**: Usar chunked uploads
   - Para archivos mayores a 50MB, implementa uploads por chunks
   - Esto requiere cambios en el código de `useFileUpload.ts`

3. **Opción 3**: Usar un servicio externo
   - Considera usar Cloudflare R2, AWS S3, o similar
   - Configura la integración en el código

## Verificación

Para verificar que los buckets existen y están configurados correctamente:

```sql
SELECT * FROM storage.buckets;
```

Para ver las políticas configuradas:

```sql
SELECT * FROM storage.policies;
```

## Troubleshooting

### Error: "File too large"
- Verifica que el archivo no exceda los límites configurados
- Revisa los límites de tu plan en Supabase
- Considera comprimir el archivo antes de subirlo

### Error: "Bucket not found"
- Asegúrate de que los buckets existan en Supabase
- Verifica los nombres de los buckets en el código

### Error: "Permission denied"
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de que el usuario esté autenticado


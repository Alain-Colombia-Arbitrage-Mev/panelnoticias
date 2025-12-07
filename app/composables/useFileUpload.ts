// Límites de tamaño de archivo (en bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB

// Tipos MIME permitidos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']

export const useFileUpload = () => {
  const supabase = useSupabaseClient()
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)

  const validateFileSize = (file: File, maxSize: number, type: string): boolean => {
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      error.value = `El archivo ${type} es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
      return false
    }
    return true
  }

  const validateFileType = (file: File, allowedTypes: string[], type: string): boolean => {
    if (!allowedTypes.includes(file.type)) {
      error.value = `Tipo de archivo no permitido para ${type}. Tipos permitidos: ${allowedTypes.join(', ')}`
      return false
    }
    return true
  }

  const uploadFile = async (
    file: File,
    bucket: string,
    folder: string = ''
  ): Promise<{ url: string; path: string } | null> => {
    uploading.value = true
    uploadProgress.value = 0
    error.value = null

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt) {
        error.value = 'No se pudo determinar la extensión del archivo'
        return null
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Simular progreso (Supabase no tiene callback de progreso nativo)
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += 10
        }
      }, 200)

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      clearInterval(progressInterval)
      uploadProgress.value = 100

      if (uploadError) {
        // Mensajes de error más descriptivos
        if (uploadError.message.includes('already exists')) {
          error.value = 'Ya existe un archivo con ese nombre. Intenta con otro archivo.'
        } else if (uploadError.message.includes('size')) {
          error.value = 'El archivo es demasiado grande para subir.'
        } else {
          error.value = `Error al subir el archivo: ${uploadError.message}`
        }
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        url: urlData.publicUrl,
        path: filePath,
      }
    } catch (err: any) {
      if (!error.value) {
        error.value = err.message || 'Error desconocido al subir el archivo'
      }
      console.error('Error uploading file:', err)
      return null
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  const uploadImage = async (file: File, folder: string = 'images') => {
    error.value = null

    if (!validateFileType(file, ALLOWED_IMAGE_TYPES, 'imagen')) {
      return null
    }

    if (!validateFileSize(file, MAX_IMAGE_SIZE, 'imagen')) {
      return null
    }

    // Usar bucket 'noticias' que ya existe, o 'news-images'
    return uploadFile(file, 'noticias', folder)
  }

  const uploadVideo = async (file: File, folder: string = 'videos') => {
    error.value = null

    if (!validateFileType(file, ALLOWED_VIDEO_TYPES, 'video')) {
      return null
    }

    if (!validateFileSize(file, MAX_VIDEO_SIZE, 'video')) {
      return null
    }

    return uploadFile(file, 'news-videos', folder)
  }

  const uploadAudio = async (file: File, folder: string = 'audios') => {
    error.value = null

    if (!validateFileType(file, ALLOWED_AUDIO_TYPES, 'audio')) {
      return null
    }

    if (!validateFileSize(file, MAX_AUDIO_SIZE, 'audio')) {
      return null
    }

    return uploadFile(file, 'news-audios', folder)
  }

  const deleteFile = async (path: string, bucket: string = 'noticias') => {
    try {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (deleteError) throw deleteError

      return true
    } catch (err: any) {
      error.value = err.message
      return false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    uploading,
    uploadProgress,
    error,
    uploadFile,
    uploadImage,
    uploadVideo,
    uploadAudio,
    deleteFile,
    clearError,
  }
}

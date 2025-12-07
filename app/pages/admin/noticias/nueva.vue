<script setup lang="ts">
import { reactive } from 'vue'
import { ArrowLeft, X, Image, Video, Music, Loader2 } from 'lucide-vue-next'
import type { CreateNoticiaInput } from '~/types/database'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const router = useRouter()
const { createArticle, loading: saving } = useNewsArticles()
const { categories, fetchCategories } = useCategories()
const { 
  uploadImage, 
  uploadVideo, 
  uploadAudio, 
  uploading, 
  uploadProgress, 
  error: uploadError,
  clearError: clearUploadError 
} = useFileUpload()
const { portalUser, fetchPortalUser } = usePortalAuth()

const form = reactive<Partial<CreateNoticiaInput>>({
  title: '',
  subtitle: '',
  excerpt: '',
  content: '',
  category_id: '',
  image_url: '',
  video_url: '',
  audio_url: '',
  status: 'draft',
  is_breaking: false,
  keywords: [],
  meta_description: '',
  source_url: '',
})

const keywordInput = ref('')

// Image
const featuredImageFile = ref<File | null>(null)
const featuredImagePreview = ref('')

// Video
const videoFile = ref<File | null>(null)
const videoPreview = ref('')

// Audio
const audioFile = ref<File | null>(null)
const audioPreview = ref('')

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchPortalUser(),
  ])
})

// Image handlers
const handleFeaturedImageChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    clearUploadError()
    // Validación rápida antes de mostrar preview
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten imágenes: JPG, PNG, GIF, WebP')
      target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Tamaño máximo: 10MB')
      target.value = ''
      return
    }
    featuredImageFile.value = file
    featuredImagePreview.value = URL.createObjectURL(file)
  }
}

const removeFeaturedImage = () => {
  featuredImageFile.value = null
  featuredImagePreview.value = ''
  form.image_url = ''
}

// Video handlers
const handleVideoChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    clearUploadError()
    // Validación rápida antes de mostrar preview
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten videos: MP4, WebM, OGG')
      target.value = ''
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('El video es demasiado grande. Tamaño máximo: 100MB')
      target.value = ''
      return
    }
    videoFile.value = file
    videoPreview.value = URL.createObjectURL(file)
  }
}

const removeVideo = () => {
  videoFile.value = null
  videoPreview.value = ''
  form.video_url = ''
}

// Audio handlers
const handleAudioChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    clearUploadError()
    // Validación rápida antes de mostrar preview
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten audios: MP3, WAV, OGG, WebM')
      target.value = ''
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('El audio es demasiado grande. Tamaño máximo: 50MB')
      target.value = ''
      return
    }
    audioFile.value = file
    audioPreview.value = URL.createObjectURL(file)
  }
}

const removeAudio = () => {
  audioFile.value = null
  audioPreview.value = ''
  form.audio_url = ''
}

// Keywords
const addKeyword = () => {
  const keyword = keywordInput.value.trim()
  if (keyword && !form.keywords?.includes(keyword)) {
    form.keywords = [...(form.keywords || []), keyword]
  }
  keywordInput.value = ''
}

const removeKeyword = (keyword: string) => {
  form.keywords = form.keywords?.filter(k => k !== keyword)
}

const handleSubmit = async () => {
  if (!form.title || !form.content || !form.category_id) {
    alert('Por favor completa los campos obligatorios: Título, Contenido y Categoría')
    return
  }

  if (!portalUser.value) {
    alert('Error: No se pudo identificar el usuario')
    return
  }

  try {
    // Upload image if selected
    if (featuredImageFile.value) {
      const result = await uploadImage(featuredImageFile.value, 'featured')
      if (!result) {
        if (uploadError.value) {
          alert(`Error al subir la imagen: ${uploadError.value}`)
          return
        }
        alert('Error al subir la imagen. Por favor, intenta de nuevo.')
        return
      }
      form.image_url = result.url
    }

    // Upload video if selected
    if (videoFile.value) {
      const result = await uploadVideo(videoFile.value, 'videos')
      if (!result) {
        if (uploadError.value) {
          alert(`Error al subir el video: ${uploadError.value}`)
          return
        }
        alert('Error al subir el video. Por favor, intenta de nuevo.')
        return
      }
      form.video_url = result.url
    }

    // Upload audio if selected
    if (audioFile.value) {
      const result = await uploadAudio(audioFile.value, 'audios')
      if (!result) {
        if (uploadError.value) {
          alert(`Error al subir el audio: ${uploadError.value}`)
          return
        }
        alert('Error al subir el audio. Por favor, intenta de nuevo.')
        return
      }
      form.audio_url = result.url
    }

    // Create article - source_type = 1 para noticias manuales del CMS
    const article = await createArticle({
      title: form.title!,
      subtitle: form.subtitle || undefined,
      category_id: form.category_id!,
      excerpt: form.excerpt || form.title!,
      content: form.content!,
      image_url: form.image_url || 'https://placehold.co/800x400?text=Sin+Imagen',
      video_url: form.video_url || undefined,
      audio_url: form.audio_url || undefined,
      status: form.status as 'draft' | 'published' | 'archived',
      is_breaking: form.is_breaking,
      source_type: 1, // 1 = manual/CMS, 0 = scraper automático
      keywords: form.keywords,
      meta_description: form.meta_description,
      source_url: form.source_url,
      author_id: portalUser.value.id,
    })

    if (article) {
      router.push('/admin/noticias')
    }
  } catch (error) {
    console.error('Error creating article:', error)
    alert('Error al crear la noticia')
  }
}

useHead({
  title: 'Nueva Noticia - Admin',
})
</script>

<template>
  <div class="max-w-4xl">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin/noticias">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </NuxtLink>
      <div>
        <h1 class="font-display text-2xl font-bold">Nueva Noticia</h1>
        <p class="text-muted-foreground">Crea una nueva noticia para el portal</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Main Content -->
      <Card>
        <CardHeader>
          <CardTitle>Contenido</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Title -->
          <div class="space-y-2">
            <Label for="title">Título *</Label>
            <Input
              id="title"
              v-model="form.title"
              placeholder="Título de la noticia"
              required
            />
          </div>

          <!-- Subtitle -->
          <div class="space-y-2">
            <Label for="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              v-model="form.subtitle"
              placeholder="Subtítulo opcional"
            />
          </div>

          <!-- Excerpt -->
          <div class="space-y-2">
            <Label for="excerpt">Resumen</Label>
            <Textarea
              id="excerpt"
              v-model="form.excerpt"
              placeholder="Breve resumen de la noticia..."
              class="min-h-[80px]"
            />
          </div>

          <!-- Content -->
          <div class="space-y-2">
            <Label for="content">Contenido *</Label>
            <Textarea
              id="content"
              v-model="form.content"
              placeholder="Escribe el contenido de la noticia aquí... (soporta HTML)"
              class="min-h-[300px]"
              required
            />
          </div>
        </CardContent>
      </Card>

      <!-- Media -->
      <Card>
        <CardHeader>
          <CardTitle>Multimedia</CardTitle>
          <CardDescription>Sube imágenes, videos o audios para tu noticia</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Featured Image -->
          <div class="space-y-2">
            <Label>Imagen Destacada</Label>
            <div
              v-if="featuredImagePreview"
              class="relative rounded-lg overflow-hidden"
            >
              <img
                :src="featuredImagePreview"
                alt="Preview"
                class="w-full h-48 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                class="absolute top-2 right-2"
                @click="removeFeaturedImage"
                :disabled="uploading"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div v-else-if="uploading" class="space-y-2">
              <div class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-accent/50">
                <Loader2 class="h-8 w-8 text-primary mb-2 animate-spin" />
                <span class="text-sm text-muted-foreground">Subiendo imagen...</span>
                <div class="w-full max-w-xs mt-2">
                  <div class="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-primary transition-all duration-300"
                      :style="{ width: `${uploadProgress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <label
              v-else
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Image class="h-8 w-8 text-muted-foreground mb-2" />
              <span class="text-sm text-muted-foreground">Click para subir imagen</span>
              <span class="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP (máx. 10MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                class="hidden"
                @change="handleFeaturedImageChange"
                :disabled="uploading"
              />
            </label>
            <p v-if="uploadError && featuredImageFile" class="text-sm text-destructive">
              {{ uploadError }}
            </p>
          </div>

          <!-- Video -->
          <div class="space-y-2">
            <Label>Video</Label>
            <div
              v-if="videoPreview"
              class="relative rounded-lg overflow-hidden"
            >
              <video
                :src="videoPreview"
                controls
                class="w-full h-48 object-cover bg-black"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                class="absolute top-2 right-2"
                @click="removeVideo"
                :disabled="uploading"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div v-else-if="uploading" class="space-y-2">
              <div class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-accent/50">
                <Loader2 class="h-8 w-8 text-primary mb-2 animate-spin" />
                <span class="text-sm text-muted-foreground">Subiendo video...</span>
                <div class="w-full max-w-xs mt-2">
                  <div class="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-primary transition-all duration-300"
                      :style="{ width: `${uploadProgress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <label
              v-else
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Video class="h-8 w-8 text-muted-foreground mb-2" />
              <span class="text-sm text-muted-foreground">Click para subir video</span>
              <span class="text-xs text-muted-foreground mt-1">MP4, WebM, OGG (máx. 100MB)</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                class="hidden"
                @change="handleVideoChange"
                :disabled="uploading"
              />
            </label>
            <p v-if="uploadError && videoFile" class="text-sm text-destructive">
              {{ uploadError }}
            </p>
          </div>

          <!-- Audio -->
          <div class="space-y-2">
            <Label>Audio</Label>
            <div
              v-if="audioPreview"
              class="relative rounded-lg overflow-hidden p-4 bg-accent"
            >
              <audio :src="audioPreview" controls class="w-full" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                class="absolute top-2 right-2"
                @click="removeAudio"
                :disabled="uploading"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div v-else-if="uploading" class="space-y-2">
              <div class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-accent/50">
                <Loader2 class="h-8 w-8 text-primary mb-2 animate-spin" />
                <span class="text-sm text-muted-foreground">Subiendo audio...</span>
                <div class="w-full max-w-xs mt-2">
                  <div class="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-primary transition-all duration-300"
                      :style="{ width: `${uploadProgress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <label
              v-else
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Music class="h-8 w-8 text-muted-foreground mb-2" />
              <span class="text-sm text-muted-foreground">Click para subir audio</span>
              <span class="text-xs text-muted-foreground mt-1">MP3, WAV, OGG, WebM (máx. 50MB)</span>
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
                class="hidden"
                @change="handleAudioChange"
                :disabled="uploading"
              />
            </label>
            <p v-if="uploadError && audioFile" class="text-sm text-destructive">
              {{ uploadError }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Settings -->
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Category -->
            <div class="space-y-2">
              <Label for="category">Categoría *</Label>
              <select
                id="category"
                v-model="form.category_id"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="">Selecciona una categoría</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <!-- Status -->
            <div class="space-y-2">
              <Label for="status">Estado</Label>
              <select
                id="status"
                v-model="form.status"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicar ahora</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>

          <!-- Keywords -->
          <div class="space-y-2">
            <Label>Palabras clave (SEO)</Label>
            <div class="flex gap-2">
              <Input
                v-model="keywordInput"
                placeholder="Añadir palabra clave..."
                @keydown.enter.prevent="addKeyword"
              />
              <Button type="button" variant="secondary" @click="addKeyword">
                Añadir
              </Button>
            </div>
            <div v-if="form.keywords?.length" class="flex flex-wrap gap-2 mt-2">
              <Badge
                v-for="keyword in form.keywords"
                :key="keyword"
                variant="secondary"
                class="cursor-pointer"
                @click="removeKeyword(keyword)"
              >
                {{ keyword }}
                <X class="h-3 w-3 ml-1" />
              </Badge>
            </div>
          </div>

          <!-- Meta Description -->
          <div class="space-y-2">
            <Label for="meta_description">Meta Descripción (SEO)</Label>
            <Textarea
              id="meta_description"
              v-model="form.meta_description"
              placeholder="Descripción para motores de búsqueda..."
              class="min-h-[60px]"
            />
          </div>

          <!-- Source URL -->
          <div class="space-y-2">
            <Label for="source_url">URL de Fuente (opcional)</Label>
            <Input
              id="source_url"
              v-model="form.source_url"
              placeholder="https://..."
              type="url"
            />
          </div>

          <!-- Is Breaking -->
          <div class="flex items-center justify-between">
            <div>
              <Label>Noticia Urgente</Label>
              <p class="text-sm text-muted-foreground">Marcar como noticia de última hora</p>
            </div>
            <Switch v-model:checked="form.is_breaking" />
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end gap-4">
        <NuxtLink to="/admin/noticias">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </NuxtLink>
        <Button type="submit" :disabled="saving || uploading">
          <Loader2 v-if="saving || uploading" class="h-4 w-4 mr-2 animate-spin" />
          {{ form.status === 'published' ? 'Publicar' : 'Guardar' }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, X, Image, Video, Music, Loader2, Trash2 } from 'lucide-vue-next'
import type { Noticia, UpdateNoticiaInput } from '~/types/database'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { fetchArticleById, updateArticle, deleteArticle, loading: saving } = useNewsArticles()
const { categories, fetchCategories } = useCategories()
const { uploadImage, uploadVideo, uploadAudio, deleteFile, uploading } = useFileUpload()

const article = ref<Noticia | null>(null)
const loading = ref(true)
const showDeleteDialog = ref(false)

const form = ref<Partial<UpdateNoticiaInput>>({
  id: '',
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

const articleId = computed(() => route.params.id as string)

onMounted(async () => {
  try {
    const [articleData] = await Promise.all([
      fetchArticleById(articleId.value),
      fetchCategories(),
    ])

    if (articleData) {
      article.value = articleData
      form.value = {
        id: articleData.id,
        title: articleData.title,
        subtitle: articleData.subtitle || '',
        excerpt: articleData.excerpt || '',
        content: articleData.content,
        category_id: articleData.category_id || '',
        image_url: articleData.image_url,
        video_url: articleData.video_url || '',
        audio_url: articleData.audio_url || '',
        status: articleData.status,
        is_breaking: articleData.is_breaking,
        keywords: articleData.keywords || [],
        meta_description: articleData.meta_description || '',
        source_url: articleData.source_url || '',
      }

      if (articleData.image_url) {
        featuredImagePreview.value = articleData.image_url
      }
      if (articleData.video_url) {
        videoPreview.value = articleData.video_url
      }
      if (articleData.audio_url) {
        audioPreview.value = articleData.audio_url
      }
    }
  } catch (error) {
    console.error('Error loading article:', error)
  } finally {
    loading.value = false
  }
})

// Image handlers
const handleFeaturedImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    featuredImageFile.value = file
    featuredImagePreview.value = URL.createObjectURL(file)
  }
}

const removeFeaturedImage = () => {
  featuredImageFile.value = null
  featuredImagePreview.value = ''
  form.value.image_url = ''
}

// Video handlers
const handleVideoChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    videoFile.value = file
    videoPreview.value = URL.createObjectURL(file)
  }
}

const removeVideo = () => {
  videoFile.value = null
  videoPreview.value = ''
  form.value.video_url = ''
}

// Audio handlers
const handleAudioChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    audioFile.value = file
    audioPreview.value = URL.createObjectURL(file)
  }
}

const removeAudio = () => {
  audioFile.value = null
  audioPreview.value = ''
  form.value.audio_url = ''
}

// Keywords
const addKeyword = () => {
  const keyword = keywordInput.value.trim()
  if (keyword && !form.value.keywords?.includes(keyword)) {
    form.value.keywords = [...(form.value.keywords || []), keyword]
  }
  keywordInput.value = ''
}

const removeKeyword = (keyword: string) => {
  form.value.keywords = form.value.keywords?.filter(k => k !== keyword)
}

const handleSubmit = async () => {
  if (!form.value.title || !form.value.content || !form.value.category_id) {
    alert('Por favor completa los campos obligatorios')
    return
  }

  try {
    // Upload new image if selected
    if (featuredImageFile.value) {
      const result = await uploadImage(featuredImageFile.value, 'featured')
      if (result) {
        form.value.image_url = result.url
      }
    }

    // Upload new video if selected
    if (videoFile.value) {
      const result = await uploadVideo(videoFile.value, 'videos')
      if (result) {
        form.value.video_url = result.url
      }
    }

    // Upload new audio if selected
    if (audioFile.value) {
      const result = await uploadAudio(audioFile.value, 'audios')
      if (result) {
        form.value.audio_url = result.url
      }
    }

    // Update article
    const updated = await updateArticle({
      id: form.value.id!,
      title: form.value.title,
      subtitle: form.value.subtitle || undefined,
      category_id: form.value.category_id,
      excerpt: form.value.excerpt || form.value.title,
      content: form.value.content,
      image_url: form.value.image_url || 'https://placehold.co/800x400?text=Sin+Imagen',
      video_url: form.value.video_url || undefined,
      audio_url: form.value.audio_url || undefined,
      status: form.value.status as 'draft' | 'published' | 'archived',
      is_breaking: form.value.is_breaking,
      keywords: form.value.keywords,
      meta_description: form.value.meta_description,
      source_url: form.value.source_url,
    })

    if (updated) {
      router.push('/admin/noticias')
    }
  } catch (error) {
    console.error('Error updating article:', error)
    alert('Error al actualizar la noticia')
  }
}

const handleDelete = async () => {
  try {
    await deleteArticle(articleId.value)
    router.push('/admin/noticias')
  } catch (error) {
    console.error('Error deleting article:', error)
    alert('Error al eliminar la noticia')
  }
}

useHead({
  title: 'Editar Noticia - Admin',
})
</script>

<template>
  <div class="max-w-4xl">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <template v-else-if="article">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin/noticias">
            <Button variant="ghost" size="icon">
              <ArrowLeft class="h-5 w-5" />
            </Button>
          </NuxtLink>
          <div>
            <h1 class="font-display text-2xl font-bold">Editar Noticia</h1>
            <p class="text-muted-foreground">Modifica los detalles de la noticia</p>
          </div>
        </div>
        <Button variant="destructive" @click="showDeleteDialog = true">
          <Trash2 class="h-4 w-4 mr-2" />
          Eliminar
        </Button>
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
            <CardDescription>Gestiona los archivos multimedia de la noticia</CardDescription>
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
                >
                  <X class="h-4 w-4" />
                </Button>
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
                  accept="image/*"
                  class="hidden"
                  @change="handleFeaturedImageChange"
                />
              </label>
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
                >
                  <X class="h-4 w-4" />
                </Button>
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
                  accept="video/*"
                  class="hidden"
                  @change="handleVideoChange"
                />
              </label>
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
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <label
                v-else
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Music class="h-8 w-8 text-muted-foreground mb-2" />
                <span class="text-sm text-muted-foreground">Click para subir audio</span>
                <span class="text-xs text-muted-foreground mt-1">MP3, WAV, OGG (máx. 10MB)</span>
                <input
                  type="file"
                  accept="audio/*"
                  class="hidden"
                  @change="handleAudioChange"
                />
              </label>
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
                  <option value="published">Publicado</option>
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
            Guardar Cambios
          </Button>
        </div>
      </form>
    </template>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="showDeleteDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Eliminar Noticia</CardTitle>
            <CardDescription>
              ¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer.
            </CardDescription>
          </CardHeader>
          <CardFooter class="flex justify-end gap-2">
            <Button variant="outline" @click="showDeleteDialog = false">
              Cancelar
            </Button>
            <Button variant="destructive" @click="handleDelete">
              Eliminar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Teleport>
  </div>
</template>

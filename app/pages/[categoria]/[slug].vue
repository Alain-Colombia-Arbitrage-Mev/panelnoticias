<script setup lang="ts">
import { Calendar, User, Eye, ArrowLeft } from 'lucide-vue-next'
import type { Noticia } from '~/types/database'

definePageMeta({
  layout: false,
})

const route = useRoute()
const router = useRouter()
const { fetchArticleBySlug, incrementViewCount } = useNewsArticles()

const article = ref<Noticia | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const categoria = computed(() => route.params.categoria as string)
const slug = computed(() => route.params.slug as string)

// Determinar si mostrar reproductores
const hasAudio = computed(() => !!article.value?.audio_url)
const hasVideo = computed(() => !!article.value?.video_url)
const showAudioFirst = computed(() => hasAudio.value && hasVideo.value)

onMounted(async () => {
  try {
    const articleData = await fetchArticleBySlug(slug.value)
    
    if (!articleData) {
      error.value = 'Noticia no encontrada'
      return
    }

    // Verificar que la categoría coincida
    if (articleData.category?.slug !== categoria.value) {
      error.value = 'La categoría no coincide'
      return
    }

    // Verificar que esté publicada
    if (articleData.status !== 'published') {
      error.value = 'Esta noticia no está disponible'
      return
    }

    article.value = articleData

    // Incrementar contador de vistas
    await incrementViewCount(articleData.id)

    // Configurar meta tags
    useHead({
      title: `${articleData.title} - ${articleData.category?.name || 'Noticias'}`,
      meta: [
        {
          name: 'description',
          content: articleData.meta_description || articleData.excerpt || articleData.title,
        },
        {
          property: 'og:title',
          content: articleData.title,
        },
        {
          property: 'og:description',
          content: articleData.meta_description || articleData.excerpt || articleData.title,
        },
        {
          property: 'og:image',
          content: articleData.image_url || '',
        },
        {
          property: 'og:type',
          content: 'article',
        },
      ],
    })
  } catch (err: any) {
    console.error('Error loading article:', err)
    error.value = err.message || 'Error al cargar la noticia'
  } finally {
    loading.value = false
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !article" class="flex flex-col items-center justify-center min-h-screen p-6">
      <div class="max-w-md text-center">
        <h1 class="text-2xl font-bold mb-4">Noticia no encontrada</h1>
        <p class="text-muted-foreground mb-6">{{ error || 'La noticia que buscas no existe o no está disponible.' }}</p>
        <Button @click="router.push('/')">
          <ArrowLeft class="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
      </div>
    </div>

    <!-- Article Content -->
    <article v-else class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header -->
      <header class="mb-8">
        <!-- Category Badge -->
        <div class="mb-4">
          <NuxtLink
            :to="`/${article.category?.slug || ''}`"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            :style="{ 
              backgroundColor: `${article.category?.color || '#3B82F6'}20`,
              color: article.category?.color || '#3B82F6'
            }"
          >
            {{ article.category?.name || 'Sin categoría' }}
          </NuxtLink>
        </div>

        <!-- Title -->
        <h1 class="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {{ article.title }}
        </h1>

        <!-- Subtitle -->
        <p v-if="article.subtitle" class="text-xl text-muted-foreground mb-6">
          {{ article.subtitle }}
        </p>

        <!-- Meta Information -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <div class="flex items-center gap-2">
            <Calendar class="h-4 w-4" />
            <span>{{ formatDate(article.published_at || article.created_at) }}</span>
          </div>
          <div v-if="article.autor" class="flex items-center gap-2">
            <User class="h-4 w-4" />
            <span>{{ article.autor.name || article.autor.email }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Eye class="h-4 w-4" />
            <span>{{ article.views || 0 }} vistas</span>
          </div>
        </div>

        <!-- Featured Image -->
        <div v-if="article.image_url" class="mb-8 rounded-lg overflow-hidden">
          <img
            :src="article.image_url"
            :alt="article.title"
            class="w-full h-auto object-cover"
          />
        </div>
      </header>

      <!-- Audio/Video Players -->
      <div v-if="hasAudio || hasVideo" class="mb-8 space-y-6">
        <!-- Audio Player (mostrar primero si hay ambos) -->
        <div v-if="hasAudio && (showAudioFirst || !hasVideo)" class="bg-card rounded-lg border p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Audio</h3>
              <p class="text-sm text-muted-foreground">Reproductor de audio</p>
            </div>
          </div>
          <audio
            :src="article.audio_url!"
            controls
            class="w-full h-12"
            preload="metadata"
          >
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>

        <!-- Video Player -->
        <div v-if="hasVideo" class="bg-card rounded-lg border overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Video</h3>
              <p class="text-sm text-muted-foreground">Reproductor de video</p>
            </div>
          </div>
          <video
            :src="article.video_url!"
            controls
            class="w-full"
            preload="metadata"
            poster=""
          >
            Tu navegador no soporta el elemento de video.
          </video>
        </div>

        <!-- Audio Player (mostrar después del video si solo hay audio y video) -->
        <div v-if="hasAudio && !showAudioFirst" class="bg-card rounded-lg border p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Audio</h3>
              <p class="text-sm text-muted-foreground">Reproductor de audio</p>
            </div>
          </div>
          <audio
            :src="article.audio_url!"
            controls
            class="w-full h-12"
            preload="metadata"
          >
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      </div>

      <!-- Article Content -->
      <div class="prose prose-lg max-w-none">
        <!-- Excerpt -->
        <p v-if="article.excerpt" class="text-xl text-muted-foreground mb-6 font-medium">
          {{ article.excerpt }}
        </p>

        <!-- Main Content -->
        <div 
          class="article-content"
          v-html="article.content"
        />
      </div>

      <!-- Keywords/Tags -->
      <div v-if="article.keywords && article.keywords.length > 0" class="mt-8 pt-8 border-t">
        <h3 class="text-sm font-semibold mb-3 text-muted-foreground">Palabras clave</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="keyword in article.keywords"
            :key="keyword"
            class="px-3 py-1 bg-muted rounded-full text-sm"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <!-- Source URL -->
      <div v-if="article.source_url" class="mt-8 pt-8 border-t">
        <a
          :href="article.source_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline text-sm"
        >
          Ver fuente original →
        </a>
      </div>
    </article>
  </div>
</template>

<style scoped>
.article-content {
  @apply text-foreground leading-relaxed;
}

.article-content :deep(p) {
  @apply mb-4;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4) {
  @apply font-bold mt-6 mb-4;
}

.article-content :deep(h1) {
  @apply text-3xl;
}

.article-content :deep(h2) {
  @apply text-2xl;
}

.article-content :deep(h3) {
  @apply text-xl;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  @apply mb-4 ml-6;
}

.article-content :deep(li) {
  @apply mb-2;
}

.article-content :deep(a) {
  @apply text-primary hover:underline;
}

.article-content :deep(img) {
  @apply rounded-lg my-6 w-full h-auto;
}

.article-content :deep(blockquote) {
  @apply border-l-4 border-primary pl-4 italic my-4 text-muted-foreground;
}

.article-content :deep(code) {
  @apply bg-muted px-1 py-0.5 rounded text-sm font-mono;
}

.article-content :deep(pre) {
  @apply bg-muted p-4 rounded-lg overflow-x-auto my-4;
}

.article-content :deep(pre code) {
  @apply bg-transparent p-0;
}
</style>

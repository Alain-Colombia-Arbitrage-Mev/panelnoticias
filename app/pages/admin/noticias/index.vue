<script setup lang="ts">
import { Plus, Search, Eye, Edit, Trash2, FileText, Zap } from 'lucide-vue-next'
import type { Noticia } from '~/types/database'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const { fetchArticles, deleteArticle, loading } = useNewsArticles()
const { categories, fetchCategories } = useCategories()

const articles = ref<Noticia[]>([])
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedCategory = ref('')
const selectedSourceType = ref('')
const selectedSort = ref('created_at')
const showDeleteDialog = ref(false)
const articleToDelete = ref<Noticia | null>(null)

onMounted(async () => {
  await Promise.all([
    loadArticles(),
    fetchCategories(),
  ])
})

const loadArticles = async () => {
  const data = await fetchArticles({
    status: selectedStatus.value || undefined,
    category_id: selectedCategory.value || undefined,
    orderBy: selectedSort.value,
    orderDirection: 'desc',
    limit: 100,
  })
  articles.value = data || []
}

watch([selectedStatus, selectedCategory, selectedSort], () => {
  loadArticles()
})

const filteredArticles = computed(() => {
  let result = articles.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query)
    )
  }

  if (selectedSourceType.value !== '') {
    const sourceType = parseInt(selectedSourceType.value)
    result = result.filter(article => article.source_type === sourceType)
  }

  return result
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return views.toString()
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    published: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    draft: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    scheduled: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    archived: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  }
  return colors[status] || colors.draft
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    published: 'Publicado',
    draft: 'Borrador',
    scheduled: 'Programado',
    archived: 'Archivado',
  }
  return labels[status] || status
}

const confirmDelete = (article: Noticia) => {
  articleToDelete.value = article
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!articleToDelete.value) return

  try {
    await deleteArticle(articleToDelete.value.id)
    articles.value = articles.value.filter(a => a.id !== articleToDelete.value?.id)
    showDeleteDialog.value = false
    articleToDelete.value = null
  } catch (error) {
    console.error('Error deleting article:', error)
  }
}

useHead({
  title: 'Noticias - Admin',
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Noticias</h1>
        <p class="text-muted-foreground">Gestiona todas las noticias del portal</p>
      </div>
      <NuxtLink to="/admin/noticias/nueva">
        <Button class="rounded-lg">
          <Plus class="h-4 w-4 mr-2" />
          Nueva Noticia
        </Button>
      </NuxtLink>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search -->
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Buscar noticias..."
              class="pl-10 rounded-lg"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="selectedStatus"
            class="h-9 w-full sm:w-[180px] rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los estados</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="scheduled">Programados</option>
            <option value="archived">Archivados</option>
          </select>

          <!-- Category Filter -->
          <select
            v-model="selectedCategory"
            class="h-9 w-full sm:w-[180px] rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todas las categorías</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>

          <!-- Sort -->
          <select
            v-model="selectedSort"
            class="h-9 w-full sm:w-[180px] rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="created_at">Más recientes</option>
            <option value="views">Más vistas</option>
            <option value="published_at">Fecha publicación</option>
          </select>
        </div>
      </CardContent>
    </Card>

    <!-- Articles List -->
    <Card>
      <CardContent class="p-0">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="relative">
            <div class="h-10 w-10 rounded-full border-2 border-primary/20"></div>
            <div class="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredArticles.length === 0" class="text-center py-16">
          <div class="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Zap class="h-7 w-7 text-muted-foreground" />
          </div>
          <p class="text-muted-foreground mb-4">No hay noticias que coincidan con tu búsqueda</p>
          <NuxtLink to="/admin/noticias/nueva">
            <Button class="rounded-lg">
              <Plus class="h-4 w-4 mr-2" />
              Crear primera noticia
            </Button>
          </NuxtLink>
        </div>

        <!-- Articles -->
        <div v-else class="divide-y divide-border/50">
          <NuxtLink
            v-for="article in filteredArticles"
            :key="article.id"
            :to="`/admin/noticias/${article.id}`"
            class="flex items-center gap-4 p-4 hover:bg-accent transition-colors group"
          >
            <!-- Thumbnail -->
            <div class="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-muted/50">
              <img
                v-if="article.image_url"
                :src="article.image_url"
                :alt="article.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                  {{ article.title }}
                </span>
                <Badge :class="[getStatusColor(article.status), 'text-xs font-medium shrink-0']">
                  {{ getStatusLabel(article.status) }}
                </Badge>
                <Badge
                  v-if="article.source_type === 1"
                  class="bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 text-xs"
                >
                  Manual
                </Badge>
                <Badge
                  v-else
                  class="bg-violet-500/15 text-violet-600 dark:text-violet-400 shrink-0 text-xs"
                >
                  Auto
                </Badge>
                <Badge v-if="article.is_breaking" class="bg-red-500/15 text-red-600 dark:text-red-400 shrink-0 text-xs">
                  Urgente
                </Badge>
              </div>
              <div class="flex items-center gap-4 text-xs text-muted-foreground">
                <span v-if="article.categoria">{{ article.categoria.name }}</span>
                <span>{{ formatDate(article.created_at) }}</span>
                <span class="flex items-center gap-1">
                  <Eye class="h-3 w-3" />
                  {{ formatViews(article.views) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 shrink-0" @click.prevent>
              <NuxtLink :to="`/admin/noticias/${article.id}`">
                <Button variant="ghost" size="icon" class="rounded-lg h-9 w-9" title="Editar">
                  <Edit class="h-4 w-4" />
                </Button>
              </NuxtLink>
              <Button
                variant="ghost"
                size="icon"
                class="rounded-lg h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Eliminar"
                @click="confirmDelete(article)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </NuxtLink>
        </div>
      </CardContent>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDeleteDialog"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          @click.self="showDeleteDialog = false"
        >
          <Card class="w-full max-w-md mx-4 shadow-2xl">
            <CardHeader>
              <CardTitle>Eliminar Noticia</CardTitle>
              <CardDescription>
                ¿Estás seguro de que deseas eliminar "{{ articleToDelete?.title }}"? Esta acción no se puede deshacer.
              </CardDescription>
            </CardHeader>
            <CardFooter class="flex justify-end gap-2">
              <Button variant="outline" class="rounded-lg" @click="showDeleteDialog = false">
                Cancelar
              </Button>
              <Button variant="destructive" class="rounded-lg" @click="handleDelete">
                Eliminar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-vue-next'
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
    limit: 50,
  })
  articles.value = data || []
}

watch([selectedStatus, selectedCategory], () => {
  loadArticles()
})

const filteredArticles = computed(() => {
  let result = articles.value
  
  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query)
    )
  }
  
  // Filtrar por tipo de fuente
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
    published: 'bg-green-500/10 text-green-500',
    draft: 'bg-yellow-500/10 text-yellow-500',
    scheduled: 'bg-blue-500/10 text-blue-500',
    archived: 'bg-gray-500/10 text-gray-500',
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="font-display text-2xl font-bold">Noticias</h1>
        <p class="text-muted-foreground">Gestiona todas las noticias del portal</p>
      </div>
      <NuxtLink to="/admin/noticias/nueva">
        <Button>
          <Plus class="h-4 w-4 mr-2" />
          Nueva Noticia
        </Button>
      </NuxtLink>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Buscar noticias..."
              class="pl-10"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="selectedStatus"
            class="h-9 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
            class="h-9 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todas las categorías</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
      </CardContent>
    </Card>

    <!-- Articles List -->
    <Card>
      <CardContent class="p-0">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="filteredArticles.length === 0" class="text-center py-12">
          <p class="text-muted-foreground mb-4">No hay noticias que coincidan con tu búsqueda</p>
          <NuxtLink to="/admin/noticias/nueva">
            <Button>
              <Plus class="h-4 w-4 mr-2" />
              Crear primera noticia
            </Button>
          </NuxtLink>
        </div>

        <div v-else class="divide-y">
          <div
            v-for="article in filteredArticles"
            :key="article.id"
            class="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
          >
            <!-- Thumbnail -->
            <div class="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
              <img
                v-if="article.image_url"
                :src="article.image_url"
                :alt="article.title"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <NuxtLink
                  :to="`/admin/noticias/${article.id}`"
                  class="font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {{ article.title }}
                </NuxtLink>
                <Badge :class="getStatusColor(article.status)" class="shrink-0">
                  {{ getStatusLabel(article.status) }}
                </Badge>
                <Badge 
                  v-if="article.source_type === 1" 
                  class="bg-blue-500/10 text-blue-500 shrink-0"
                  title="Noticia creada manualmente"
                >
                  Manual
                </Badge>
                <Badge 
                  v-else 
                  class="bg-purple-500/10 text-purple-500 shrink-0"
                  title="Noticia del scraper automático"
                >
                  Auto
                </Badge>
                <Badge v-if="article.is_breaking" class="bg-red-500/10 text-red-500 shrink-0">
                  Urgente
                </Badge>
              </div>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span v-if="article.categoria">{{ article.categoria.name }}</span>
                <span>{{ formatDate(article.created_at) }}</span>
                <span class="flex items-center gap-1">
                  <Eye class="h-3 w-3" />
                  {{ formatViews(article.views) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <NuxtLink :to="`/admin/noticias/${article.id}`">
                <Button variant="ghost" size="icon" title="Editar">
                  <Edit class="h-4 w-4" />
                </Button>
              </NuxtLink>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Eliminar"
                class="text-destructive hover:text-destructive hover:bg-destructive/10"
                @click="confirmDelete(article)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

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
              ¿Estás seguro de que deseas eliminar "{{ articleToDelete?.title }}"? Esta acción no se puede deshacer.
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


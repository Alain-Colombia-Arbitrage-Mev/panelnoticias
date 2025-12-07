<script setup lang="ts">
import { FileText, Eye, TrendingUp, FolderOpen, Plus } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const supabase = useSupabaseClient()

const stats = ref({
  totalArticles: 0,
  publishedArticles: 0,
  totalViews: 0,
  totalCategories: 0,
})

const recentArticles = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    // Fetch stats - usando las tablas correctas: noticias, categorias
    const [articlesCount, publishedCount, viewsSum, categoriesCount, recent] = await Promise.all([
      supabase.from('noticias').select('id', { count: 'exact', head: true }),
      supabase.from('noticias').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('noticias').select('views'),
      supabase.from('categorias').select('id', { count: 'exact', head: true }),
      supabase.from('noticias').select('id, title, status, views, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    stats.value = {
      totalArticles: articlesCount.count || 0,
      publishedArticles: publishedCount.count || 0,
      totalViews: viewsSum.data?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0,
      totalCategories: categoriesCount.count || 0,
    }

    recentArticles.value = recent.data || []
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
})

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
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

useHead({
  title: 'Dashboard - Admin',
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <template v-else>
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="font-display text-3xl font-bold mb-2">Dashboard</h1>
        <p class="text-muted-foreground">Bienvenido al panel de administración de noticias.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Total Artículos</p>
                <p class="text-3xl font-bold">{{ formatNumber(stats.totalArticles) }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText class="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Publicados</p>
                <p class="text-3xl font-bold">{{ formatNumber(stats.publishedArticles) }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp class="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Vistas Totales</p>
                <p class="text-3xl font-bold">{{ formatNumber(stats.totalViews) }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Eye class="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Categorías</p>
                <p class="text-3xl font-bold">{{ formatNumber(stats.totalCategories) }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <FolderOpen class="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Quick Actions & Recent Articles -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quick Actions -->
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <NuxtLink to="/admin/noticias/nueva">
              <Button class="w-full justify-start">
                <Plus class="h-4 w-4 mr-2" />
                Nueva Noticia
              </Button>
            </NuxtLink>
            <NuxtLink to="/admin/noticias">
              <Button variant="outline" class="w-full justify-start">
                <FileText class="h-4 w-4 mr-2" />
                Ver Todas las Noticias
              </Button>
            </NuxtLink>
            <NuxtLink to="/admin/categorias">
              <Button variant="outline" class="w-full justify-start">
                <FolderOpen class="h-4 w-4 mr-2" />
                Gestionar Categorías
              </Button>
            </NuxtLink>
          </CardContent>
        </Card>

        <!-- Recent Articles -->
        <Card class="lg:col-span-2">
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Artículos Recientes</CardTitle>
            <NuxtLink to="/admin/noticias">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </NuxtLink>
          </CardHeader>
          <CardContent>
            <div v-if="recentArticles.length > 0" class="space-y-4">
              <div
                v-for="article in recentArticles"
                :key="article.id"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <NuxtLink
                    :to="`/admin/noticias/${article.id}`"
                    class="font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {{ article.title }}
                  </NuxtLink>
                  <div class="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{{ formatDate(article.created_at) }}</span>
                    <span class="flex items-center gap-1">
                      <Eye class="h-3 w-3" />
                      {{ formatNumber(article.views || 0) }}
                    </span>
                  </div>
                </div>
                <Badge :class="getStatusColor(article.status)">
                  {{ getStatusLabel(article.status) }}
                </Badge>
              </div>
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No hay artículos aún
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>


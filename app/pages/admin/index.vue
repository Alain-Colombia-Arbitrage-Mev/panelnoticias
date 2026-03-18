<script setup lang="ts">
import { FileText, Eye, TrendingUp, FolderOpen, Plus, ArrowUpRight, Clock, Zap } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const supabase = useSupabaseClient()
const { portalUser } = usePortalAuth()

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
    published: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    draft: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    scheduled: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    archived: 'bg-muted text-muted-foreground',
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

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

useHead({
  title: 'Dashboard - Admin',
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="relative">
        <div class="h-10 w-10 rounded-full border-2 border-border"></div>
        <div class="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-foreground animate-spin"></div>
      </div>
    </div>

    <template v-else>
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold tracking-tight mb-1">
          {{ greeting }}<span v-if="portalUser?.name">, {{ portalUser.name.split(' ')[0] }}</span>
        </h1>
        <p class="text-muted-foreground text-sm">Aqui tienes un resumen de tu portal de noticias.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Total Articles -->
        <Card class="hover:border-foreground/10 transition-colors">
          <CardContent class="p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground font-medium">Articulos</span>
              <FileText class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="text-2xl font-semibold tracking-tight">{{ formatNumber(stats.totalArticles) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Total en el sistema</p>
          </CardContent>
        </Card>

        <!-- Published -->
        <Card class="hover:border-foreground/10 transition-colors">
          <CardContent class="p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground font-medium">Publicados</span>
              <TrendingUp class="h-4 w-4 text-emerald-500" />
            </div>
            <p class="text-2xl font-semibold tracking-tight">{{ formatNumber(stats.publishedArticles) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Activos ahora</p>
          </CardContent>
        </Card>

        <!-- Views -->
        <Card class="hover:border-foreground/10 transition-colors">
          <CardContent class="p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground font-medium">Vistas</span>
              <Eye class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="text-2xl font-semibold tracking-tight">{{ formatNumber(stats.totalViews) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Vistas totales</p>
          </CardContent>
        </Card>

        <!-- Categories -->
        <Card class="hover:border-foreground/10 transition-colors">
          <CardContent class="p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground font-medium">Categorias</span>
              <FolderOpen class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="text-2xl font-semibold tracking-tight">{{ formatNumber(stats.totalCategories) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Categorias activas</p>
          </CardContent>
        </Card>
      </div>

      <!-- Quick Actions & Recent Articles -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Quick Actions -->
        <div class="space-y-3">
          <NuxtLink to="/admin/noticias/nueva" class="block group">
            <Card class="hover:border-foreground/10 transition-colors">
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
                    <Plus class="h-5 w-5 text-background" />
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium">Nueva Noticia</p>
                    <p class="text-xs text-muted-foreground">Crear un articulo</p>
                  </div>
                  <ArrowUpRight class="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          </NuxtLink>

          <NuxtLink to="/admin/noticias" class="block group">
            <Card class="hover:border-foreground/10 transition-colors">
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium">Todas las Noticias</p>
                    <p class="text-xs text-muted-foreground">{{ stats.totalArticles }} articulos</p>
                  </div>
                  <ArrowUpRight class="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          </NuxtLink>

          <NuxtLink to="/admin/categorias" class="block group">
            <Card class="hover:border-foreground/10 transition-colors">
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FolderOpen class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium">Categorias</p>
                    <p class="text-xs text-muted-foreground">{{ stats.totalCategories }} categorias</p>
                  </div>
                  <ArrowUpRight class="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          </NuxtLink>
        </div>

        <!-- Recent Articles -->
        <Card class="lg:col-span-2">
          <CardHeader class="flex flex-row items-center justify-between pb-4">
            <div class="flex items-center gap-2">
              <Clock class="h-4 w-4 text-muted-foreground" />
              <CardTitle class="text-sm font-medium">Articulos Recientes</CardTitle>
            </div>
            <NuxtLink to="/admin/noticias">
              <Button variant="ghost" size="sm" class="text-xs h-8 rounded-lg">
                Ver todos
                <ArrowUpRight class="h-3 w-3 ml-1" />
              </Button>
            </NuxtLink>
          </CardHeader>
          <CardContent>
            <div v-if="recentArticles.length > 0" class="space-y-0.5">
              <NuxtLink
                v-for="article in recentArticles"
                :key="article.id"
                :to="`/admin/noticias/${article.id}`"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm line-clamp-1 group-hover:text-foreground transition-colors">
                    {{ article.title }}
                  </p>
                  <div class="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{{ formatDate(article.created_at) }}</span>
                    <span class="flex items-center gap-1">
                      <Eye class="h-3 w-3" />
                      {{ formatNumber(article.views || 0) }}
                    </span>
                  </div>
                </div>
                <Badge :class="[getStatusColor(article.status), 'text-xs font-medium']">
                  {{ getStatusLabel(article.status) }}
                </Badge>
              </NuxtLink>
            </div>
            <div v-else class="text-center py-12">
              <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Zap class="h-5 w-5 text-muted-foreground" />
              </div>
              <p class="text-muted-foreground text-sm">No hay articulos aun</p>
              <NuxtLink to="/admin/noticias/nueva">
                <Button size="sm" class="mt-3 rounded-lg">
                  <Plus class="h-4 w-4 mr-1" />
                  Crear el primero
                </Button>
              </NuxtLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>

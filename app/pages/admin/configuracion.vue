<script setup lang="ts">
import { Settings, Trash2, RefreshCw, Loader2, CheckCircle, Database, Info } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin-only'],
})

const supabase = useSupabaseClient()
const { isAdmin } = usePortalAuth()

const cleanupLoading = ref(false)
const cleanupResult = ref<{ success: boolean; deleted_count: number } | null>(null)

const runCleanup = async () => {
  cleanupLoading.value = true
  cleanupResult.value = null

  try {
    const { data, error } = await supabase.rpc('cleanup_expired_articles')

    if (error) throw error

    cleanupResult.value = data
  } catch (error) {
    console.error('Error running cleanup:', error)
    cleanupResult.value = { success: false, deleted_count: 0 }
  } finally {
    cleanupLoading.value = false
  }
}

useHead({
  title: 'Configuración - Admin',
})
</script>

<template>
  <div class="max-w-2xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">Configuración</h1>
      <p class="text-muted-foreground">Ajustes del portal de noticias</p>
    </div>

    <div class="space-y-6">
      <!-- Auto-delete Section -->
      <Card class="overflow-hidden">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Trash2 class="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle>Limpieza Automática</CardTitle>
              <CardDescription>
                Elimina las noticias que han superado su tiempo de vida configurado.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="p-4 rounded-lg bg-muted/30 border border-border/50">
            <h4 class="font-medium mb-2 text-sm">¿Cómo funciona?</h4>
            <ul class="text-sm text-muted-foreground space-y-1.5">
              <li class="flex items-start gap-2">
                <span class="text-primary mt-1">•</span>
                Las noticias con "Auto-eliminar" activado se eliminan automáticamente
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-1">•</span>
                El tiempo de eliminación se cuenta desde la fecha de publicación
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-1">•</span>
                Por defecto, las noticias se eliminan después de 3 días
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-1">•</span>
                Puedes configurar el tiempo por cada noticia individual
              </li>
            </ul>
          </div>

          <div
            v-if="cleanupResult"
            class="p-4 rounded-lg flex items-center gap-3"
            :class="cleanupResult.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'"
          >
            <CheckCircle v-if="cleanupResult.success" class="h-5 w-5 text-emerald-500 shrink-0" />
            <span :class="cleanupResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'" class="text-sm">
              {{ cleanupResult.success
                ? `Se eliminaron ${cleanupResult.deleted_count} noticia(s) expirada(s)`
                : 'Error al ejecutar la limpieza'
              }}
            </span>
          </div>

          <Button
            @click="runCleanup"
            :disabled="cleanupLoading"
            variant="outline"
            class="rounded-lg"
          >
            <Loader2 v-if="cleanupLoading" class="h-4 w-4 mr-2 animate-spin" />
            <RefreshCw v-else class="h-4 w-4 mr-2" />
            Ejecutar Limpieza Ahora
          </Button>
        </CardContent>
      </Card>

      <!-- Storage Section -->
      <Card class="overflow-hidden">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Database class="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Almacenamiento</CardTitle>
              <CardDescription>
                Configuración del almacenamiento de archivos multimedia.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="p-4 rounded-lg bg-muted/30 border border-border/50">
            <h4 class="font-medium mb-2 text-sm">Información</h4>
            <ul class="text-sm text-muted-foreground space-y-1.5">
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                Los archivos se almacenan en Supabase Storage
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                Bucket: <code class="bg-background/50 px-1.5 py-0.5 rounded-md text-xs font-mono">news-media</code>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                Formatos soportados: imágenes, videos, audios
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                Los archivos se organizan en carpetas por tipo
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <!-- Info Section -->
      <Card class="overflow-hidden">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Info class="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle>Acerca del Portal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 rounded-lg bg-muted/30">
              <span class="text-sm text-muted-foreground">Versión</span>
              <span class="text-sm font-medium">1.0.0</span>
            </div>
            <div class="flex justify-between items-center p-3 rounded-lg bg-muted/30">
              <span class="text-sm text-muted-foreground">Framework</span>
              <span class="text-sm font-medium">Nuxt 4</span>
            </div>
            <div class="flex justify-between items-center p-3 rounded-lg bg-muted/30">
              <span class="text-sm text-muted-foreground">UI</span>
              <span class="text-sm font-medium">shadcn-vue + Tailwind CSS</span>
            </div>
            <div class="flex justify-between items-center p-3 rounded-lg bg-muted/30">
              <span class="text-sm text-muted-foreground">Backend</span>
              <span class="text-sm font-medium">Supabase</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Settings, Trash2, RefreshCw, Loader2, CheckCircle } from 'lucide-vue-next'

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
    <div class="mb-6">
      <h1 class="font-display text-2xl font-bold">Configuración</h1>
      <p class="text-muted-foreground">Ajustes del portal de noticias</p>
    </div>

    <div class="space-y-6">
      <!-- Auto-delete Section -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Trash2 class="h-5 w-5 text-destructive" />
            <CardTitle>Limpieza Automática</CardTitle>
          </div>
          <CardDescription>
            Elimina las noticias que han superado su tiempo de vida configurado.
            Esta función se ejecuta automáticamente, pero puedes ejecutarla manualmente aquí.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="p-4 rounded-lg bg-muted/50">
            <h4 class="font-medium mb-2">¿Cómo funciona?</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• Las noticias con "Auto-eliminar" activado se eliminan automáticamente</li>
              <li>• El tiempo de eliminación se cuenta desde la fecha de publicación</li>
              <li>• Por defecto, las noticias se eliminan después de 3 días</li>
              <li>• Puedes configurar el tiempo por cada noticia individual</li>
            </ul>
          </div>

          <div v-if="cleanupResult" class="p-4 rounded-lg" :class="cleanupResult.success ? 'bg-green-500/10' : 'bg-red-500/10'">
            <div class="flex items-center gap-2">
              <CheckCircle v-if="cleanupResult.success" class="h-5 w-5 text-green-500" />
              <span :class="cleanupResult.success ? 'text-green-500' : 'text-red-500'">
                {{ cleanupResult.success 
                  ? `Se eliminaron ${cleanupResult.deleted_count} noticia(s) expirada(s)`
                  : 'Error al ejecutar la limpieza'
                }}
              </span>
            </div>
          </div>

          <Button
            @click="runCleanup"
            :disabled="cleanupLoading"
            variant="outline"
          >
            <Loader2 v-if="cleanupLoading" class="h-4 w-4 mr-2 animate-spin" />
            <RefreshCw v-else class="h-4 w-4 mr-2" />
            Ejecutar Limpieza Ahora
          </Button>
        </CardContent>
      </Card>

      <!-- Storage Section -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Settings class="h-5 w-5" />
            <CardTitle>Almacenamiento</CardTitle>
          </div>
          <CardDescription>
            Configuración del almacenamiento de archivos multimedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="p-4 rounded-lg bg-muted/50">
            <h4 class="font-medium mb-2">Información</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• Los archivos se almacenan en Supabase Storage</li>
              <li>• Bucket: <code class="bg-background px-1 rounded">news-media</code></li>
              <li>• Formatos soportados: imágenes, videos, audios</li>
              <li>• Los archivos se organizan en carpetas por tipo</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <!-- Info Section -->
      <Card>
        <CardHeader>
          <CardTitle>Acerca del Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Versión</span>
              <span>1.0.0</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Framework</span>
              <span>Nuxt 4</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">UI</span>
              <span>shadcn-vue + Tailwind CSS</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Backend</span>
              <span>Supabase</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>


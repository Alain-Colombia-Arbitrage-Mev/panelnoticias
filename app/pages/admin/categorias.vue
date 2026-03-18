<script setup lang="ts">
import { Plus, Edit, Trash2, X, Loader2, FolderOpen } from 'lucide-vue-next'
import type { NewsCategory } from '~/types/database'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const supabase = useSupabaseClient()
const { categories, fetchCategories, loading } = useCategories()

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editingCategory = ref<NewsCategory | null>(null)
const categoryToDelete = ref<NewsCategory | null>(null)
const saving = ref(false)

const form = ref({
  name: '',
  slug: '',
  description: '',
  color: '#3B82F6',
  display_order: 0,
})

onMounted(() => {
  fetchCategories()
})

const openCreateDialog = () => {
  editingCategory.value = null
  form.value = {
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    display_order: categories.value.length,
  }
  showDialog.value = true
}

const openEditDialog = (category: NewsCategory) => {
  editingCategory.value = category
  form.value = {
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    color: category.color,
    display_order: category.display_order,
  }
  showDialog.value = true
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

watch(() => form.value.name, (newName) => {
  if (!editingCategory.value) {
    form.value.slug = generateSlug(newName)
  }
})

const handleSubmit = async () => {
  if (!form.value.name || !form.value.slug) return

  saving.value = true

  try {
    if (editingCategory.value) {
      const { error } = await supabase
        .from('news_categories')
        .update({
          name: form.value.name,
          slug: form.value.slug,
          description: form.value.description || null,
          color: form.value.color,
          display_order: form.value.display_order,
        })
        .eq('id', editingCategory.value.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('news_categories')
        .insert({
          name: form.value.name,
          slug: form.value.slug,
          description: form.value.description || null,
          color: form.value.color,
          display_order: form.value.display_order,
        })

      if (error) throw error
    }

    await fetchCategories()
    showDialog.value = false
  } catch (error) {
    console.error('Error saving category:', error)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (category: NewsCategory) => {
  categoryToDelete.value = category
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!categoryToDelete.value) return

  try {
    const { error } = await supabase
      .from('news_categories')
      .delete()
      .eq('id', categoryToDelete.value.id)

    if (error) throw error

    await fetchCategories()
    showDeleteDialog.value = false
    categoryToDelete.value = null
  } catch (error) {
    console.error('Error deleting category:', error)
  }
}

const colorOptions = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  '#84CC16', '#6366F1', '#14B8A6', '#F43F5E',
]

useHead({
  title: 'Categorías - Admin',
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="font-display text-3xl font-bold">Categorías</h1>
        <p class="text-muted-foreground">Gestiona las categorías de noticias</p>
      </div>
      <Button class="rounded-xl shadow-lg shadow-primary/20" @click="openCreateDialog">
        <Plus class="h-4 w-4 mr-2" />
        Nueva Categoría
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="relative">
        <div class="h-10 w-10 rounded-full border-2 border-primary/20"></div>
        <div class="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="categories.length === 0" class="text-center py-16">
      <div class="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <FolderOpen class="h-7 w-7 text-muted-foreground" />
      </div>
      <p class="text-muted-foreground mb-4">No hay categorías creadas</p>
      <Button class="rounded-xl" @click="openCreateDialog">
        <Plus class="h-4 w-4 mr-2" />
        Crear primera categoría
      </Button>
    </div>

    <!-- Categories Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="category in categories"
        :key="category.id"
        class="group overflow-hidden hover:shadow-lg hover:-translate-y-0.5"
      >
        <div
          class="h-1.5 rounded-t-2xl"
          :style="{ backgroundColor: category.color }"
        />
        <CardContent class="p-5">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2.5 mb-2">
                <div
                  class="w-5 h-5 rounded-lg"
                  :style="{ backgroundColor: category.color + '30' }"
                >
                  <div
                    class="w-full h-full rounded-lg flex items-center justify-center"
                  >
                    <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: category.color }" />
                  </div>
                </div>
                <h3 class="font-semibold">{{ category.name }}</h3>
              </div>
              <p class="text-xs text-muted-foreground mb-2 font-mono">
                /categoria/{{ category.slug }}
              </p>
              <p v-if="category.description" class="text-sm text-muted-foreground line-clamp-2">
                {{ category.description }}
              </p>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" class="h-8 w-8 rounded-lg" @click="openEditDialog(category)">
                <Edit class="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" class="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" @click="confirmDelete(category)">
                <Trash2 class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDialog"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          @click.self="showDialog = false"
        >
          <Card class="w-full max-w-md mx-4 shadow-2xl">
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle>{{ editingCategory ? 'Editar' : 'Nueva' }} Categoría</CardTitle>
                <Button variant="ghost" size="icon" class="rounded-xl" @click="showDialog = false">
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <form @submit.prevent="handleSubmit">
              <CardContent class="space-y-4">
                <!-- Name -->
                <div class="space-y-2">
                  <Label for="name">Nombre *</Label>
                  <Input
                    id="name"
                    v-model="form.name"
                    placeholder="Nombre de la categoría"
                    class="rounded-xl"
                    required
                  />
                </div>

                <!-- Slug -->
                <div class="space-y-2">
                  <Label for="slug">Slug *</Label>
                  <Input
                    id="slug"
                    v-model="form.slug"
                    placeholder="slug-de-la-categoria"
                    class="rounded-xl font-mono text-sm"
                    required
                  />
                </div>

                <!-- Description -->
                <div class="space-y-2">
                  <Label for="description">Descripción</Label>
                  <Textarea
                    id="description"
                    v-model="form.description"
                    placeholder="Descripción opcional..."
                    class="min-h-[80px] rounded-xl"
                  />
                </div>

                <!-- Color -->
                <div class="space-y-2">
                  <Label>Color</Label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in colorOptions"
                      :key="color"
                      type="button"
                      class="w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-110"
                      :class="form.color === color ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'"
                      :style="{ backgroundColor: color }"
                      @click="form.color = color"
                    />
                  </div>
                </div>

                <!-- Display Order -->
                <div class="space-y-2">
                  <Label for="order">Orden de visualización</Label>
                  <Input
                    id="order"
                    v-model.number="form.display_order"
                    type="number"
                    min="0"
                    class="rounded-xl"
                  />
                </div>
              </CardContent>
              <CardFooter class="flex justify-end gap-2">
                <Button type="button" variant="outline" class="rounded-xl" @click="showDialog = false">
                  Cancelar
                </Button>
                <Button type="submit" class="rounded-xl" :disabled="saving">
                  <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
                  {{ editingCategory ? 'Guardar' : 'Crear' }}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </Transition>
    </Teleport>

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
              <CardTitle>Eliminar Categoría</CardTitle>
              <CardDescription>
                ¿Estás seguro de que deseas eliminar "{{ categoryToDelete?.name }}"? Las noticias de esta categoría quedarán sin categoría asignada.
              </CardDescription>
            </CardHeader>
            <CardFooter class="flex justify-end gap-2">
              <Button variant="outline" class="rounded-xl" @click="showDeleteDialog = false">
                Cancelar
              </Button>
              <Button variant="destructive" class="rounded-xl" @click="handleDelete">
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

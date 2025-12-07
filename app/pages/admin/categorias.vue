<script setup lang="ts">
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-vue-next'
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
      // Update
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
      // Create
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="font-display text-2xl font-bold">Categorías</h1>
        <p class="text-muted-foreground">Gestiona las categorías de noticias</p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="h-4 w-4 mr-2" />
        Nueva Categoría
      </Button>
    </div>

    <!-- Categories Grid -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="categories.length === 0" class="text-center py-12">
      <p class="text-muted-foreground mb-4">No hay categorías creadas</p>
      <Button @click="openCreateDialog">
        <Plus class="h-4 w-4 mr-2" />
        Crear primera categoría
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="category in categories"
        :key="category.id"
        class="overflow-hidden"
      >
        <div
          class="h-2"
          :style="{ backgroundColor: category.color }"
        />
        <CardContent class="p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <div
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: category.color }"
                />
                <h3 class="font-semibold">{{ category.name }}</h3>
              </div>
              <p class="text-sm text-muted-foreground mb-2">
                /categoria/{{ category.slug }}
              </p>
              <p v-if="category.description" class="text-sm text-muted-foreground line-clamp-2">
                {{ category.description }}
              </p>
            </div>
            <div class="flex gap-1">
              <Button variant="ghost" size="icon" @click="openEditDialog(category)">
                <Edit class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="confirmDelete(category)">
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Dialog -->
    <Teleport to="body">
      <div
        v-if="showDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle>{{ editingCategory ? 'Editar' : 'Nueva' }} Categoría</CardTitle>
              <Button variant="ghost" size="icon" @click="showDialog = false">
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
                  class="min-h-[80px]"
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
                    class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    :class="form.color === color ? 'border-foreground scale-110' : 'border-transparent'"
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
                />
              </div>
            </CardContent>
            <CardFooter class="flex justify-end gap-2">
              <Button type="button" variant="outline" @click="showDialog = false">
                Cancelar
              </Button>
              <Button type="submit" :disabled="saving">
                <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
                {{ editingCategory ? 'Guardar' : 'Crear' }}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="showDeleteDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Eliminar Categoría</CardTitle>
            <CardDescription>
              ¿Estás seguro de que deseas eliminar "{{ categoryToDelete?.name }}"? Las noticias de esta categoría quedarán sin categoría asignada.
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


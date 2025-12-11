<script setup lang="ts">
import { Plus, Edit, Trash2, X, Loader2, Shield, User as UserIcon } from 'lucide-vue-next'
import type { NewsPortalUser } from '~/types/database'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin-only'],
})

const supabase = useSupabaseClient()
const { isAdmin } = usePortalAuth()

const users = ref<NewsPortalUser[]>([])
const loading = ref(true)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editingUser = ref<NewsPortalUser | null>(null)
const userToDelete = ref<NewsPortalUser | null>(null)
const saving = ref(false)

const form = ref({
  email: '',
  username: '',
  full_name: '',
  role: 'editor' as 'admin' | 'editor' | 'viewer',
})

onMounted(async () => {
  await fetchUsers()
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('news_portal_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    users.value = data as NewsPortalUser[]
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const openEditDialog = (user: NewsPortalUser) => {
  editingUser.value = user
  form.value = {
    email: user.email,
    username: user.username,
    full_name: user.full_name || '',
    role: user.role,
  }
  showDialog.value = true
}

const handleSubmit = async () => {
  if (!editingUser.value) return

  saving.value = true

  try {
    const { error } = await supabase
      .from('news_portal_users')
      .update({
        username: form.value.username,
        full_name: form.value.full_name || null,
        role: form.value.role,
      })
      .eq('id', editingUser.value.id)

    if (error) throw error

    await fetchUsers()
    showDialog.value = false
  } catch (error) {
    console.error('Error updating user:', error)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (user: NewsPortalUser) => {
  userToDelete.value = user
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!userToDelete.value) return

  try {
    const { error } = await supabase
      .from('news_portal_users')
      .update({ is_active: false })
      .eq('id', userToDelete.value.id)

    if (error) throw error

    await fetchUsers()
    showDeleteDialog.value = false
    userToDelete.value = null
  } catch (error) {
    console.error('Error deactivating user:', error)
  }
}

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-500',
    editor: 'bg-blue-500/10 text-blue-500',
    viewer: 'bg-gray-500/10 text-gray-500',
  }
  return colors[role] || colors.viewer
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Visor',
  }
  return labels[role] || role
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

useHead({
  title: 'Usuarios - Admin',
})
</script>

<template>
  <div>
    <!-- Access Check -->
    <div v-if="!isAdmin" class="text-center py-12">
      <Shield class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 class="font-display text-xl font-bold mb-2">Acceso Restringido</h2>
      <p class="text-muted-foreground">Solo los administradores pueden gestionar usuarios.</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold">Usuarios</h1>
          <p class="text-muted-foreground">Gestiona los usuarios del portal</p>
        </div>
      </div>

      <!-- Users List -->
      <Card>
        <CardContent class="p-0">
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>

          <div v-else-if="users.length === 0" class="text-center py-12">
            <p class="text-muted-foreground">No hay usuarios registrados</p>
          </div>

          <div v-else class="divide-y">
            <div
              v-for="user in users"
              :key="user.id"
              class="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
            >
              <!-- Avatar -->
              <Avatar class="h-12 w-12">
                <AvatarImage :src="user.avatar_url || ''" />
                <AvatarFallback>{{ user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase() }}</AvatarFallback>
              </Avatar>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium">{{ user.full_name || user.username }}</span>
                  <Badge :class="getRoleColor(user.role)">
                    {{ getRoleLabel(user.role) }}
                  </Badge>
                  <Badge v-if="!user.is_active" variant="outline" class="text-muted-foreground">
                    Inactivo
                  </Badge>
                </div>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{{ user.email }}</span>
                  <span>@{{ user.username }}</span>
                  <span>Desde {{ formatDate(user.created_at) }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" @click="openEditDialog(user)">
                  <Edit class="h-4 w-4" />
                </Button>
                <Button
                  v-if="user.is_active"
                  variant="ghost"
                  size="icon"
                  @click="confirmDelete(user)"
                >
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Edit Dialog -->
    <Teleport to="body">
      <div
        v-if="showDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle>Editar Usuario</CardTitle>
              <Button variant="ghost" size="icon" @click="showDialog = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <form @submit.prevent="handleSubmit">
            <CardContent class="space-y-4">
              <!-- Email (readonly) -->
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  v-model="form.email"
                  disabled
                  class="bg-muted"
                />
              </div>

              <!-- Username -->
              <div class="space-y-2">
                <Label for="username">Nombre de usuario *</Label>
                <Input
                  id="username"
                  v-model="form.username"
                  placeholder="username"
                  required
                />
              </div>

              <!-- Full Name -->
              <div class="space-y-2">
                <Label for="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  v-model="form.full_name"
                  placeholder="Juan Pérez"
                />
              </div>

              <!-- Role -->
              <div class="space-y-2">
                <Label>Rol</Label>
                <Select v-model="form.role">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Visor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter class="flex justify-end gap-2">
              <Button type="button" variant="outline" @click="showDialog = false">
                Cancelar
              </Button>
              <Button type="submit" :disabled="saving">
                <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
                Guardar
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
            <CardTitle>Desactivar Usuario</CardTitle>
            <CardDescription>
              ¿Estás seguro de que deseas desactivar a "{{ userToDelete?.full_name || userToDelete?.username }}"? El usuario ya no podrá acceder al panel.
            </CardDescription>
          </CardHeader>
          <CardFooter class="flex justify-end gap-2">
            <Button variant="outline" @click="showDeleteDialog = false">
              Cancelar
            </Button>
            <Button variant="destructive" @click="handleDelete">
              Desactivar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Teleport>
  </div>
</template>


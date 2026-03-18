<script setup lang="ts">
import { Plus, Edit, Trash2, X, Loader2, Shield, UserPlus, Eye, EyeOff, AlertTriangle } from 'lucide-vue-next'
import type { NewsPortalUser } from '~/types/database'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin-only'],
})

const supabase = useSupabaseClient()
const { isAdmin, portalUser } = usePortalAuth()

const users = ref<NewsPortalUser[]>([])
const loading = ref(true)
const showEditDialog = ref(false)
const showCreateDialog = ref(false)
const showDeactivateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingUser = ref<NewsPortalUser | null>(null)
const userToDeactivate = ref<NewsPortalUser | null>(null)
const userToDelete = ref<NewsPortalUser | null>(null)
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const editForm = ref({
  email: '',
  username: '',
  full_name: '',
  role: 'editor' as 'admin' | 'editor' | 'viewer',
})

const createForm = ref({
  email: '',
  password: '',
  role: 'editor' as 'admin' | 'editor' | 'viewer',
})

const showPassword = ref(false)

onMounted(async () => {
  await fetchUsers()
})

const showNotification = (type: 'success' | 'error', message: string) => {
  if (type === 'success') {
    successMessage.value = message
    errorMessage.value = ''
  } else {
    errorMessage.value = message
    successMessage.value = ''
  }
  setTimeout(() => {
    successMessage.value = ''
    errorMessage.value = ''
  }, 4000)
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('usuarios')
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

// --- Create User ---
const openCreateDialog = () => {
  createForm.value = { email: '', password: '', role: 'editor' }
  showPassword.value = false
  errorMessage.value = ''
  showCreateDialog.value = true
}

const handleCreate = async () => {
  saving.value = true
  errorMessage.value = ''

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    if (!token) {
      showNotification('error', 'Sesión expirada. Vuelve a iniciar sesión.')
      return
    }

    const response = await $fetch('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        email: createForm.value.email,
        password: createForm.value.password,
        role: createForm.value.role,
      },
    })

    if (response.success) {
      showCreateDialog.value = false
      await fetchUsers()
      showNotification('success', `Usuario ${createForm.value.email} creado exitosamente`)
    }
  } catch (err: any) {
    const message = err.data?.message || err.message || 'Error al crear el usuario'
    showNotification('error', message)
  } finally {
    saving.value = false
  }
}

// --- Edit User ---
const openEditDialog = (user: NewsPortalUser) => {
  editingUser.value = user
  editForm.value = {
    email: user.email,
    username: user.name || '',
    full_name: user.name || '',
    role: user.role as 'admin' | 'editor' | 'viewer',
  }
  showEditDialog.value = true
}

const handleEdit = async () => {
  if (!editingUser.value) return

  saving.value = true

  try {
    const { error } = await supabase
      .from('usuarios')
      .update({
        name: editForm.value.full_name || editForm.value.username,
        role: editForm.value.role,
      })
      .eq('id', editingUser.value.id)

    if (error) throw error

    await fetchUsers()
    showEditDialog.value = false
    showNotification('success', 'Usuario actualizado')
  } catch (error) {
    console.error('Error updating user:', error)
    showNotification('error', 'Error al actualizar el usuario')
  } finally {
    saving.value = false
  }
}

// --- Deactivate User ---
const confirmDeactivate = (user: NewsPortalUser) => {
  userToDeactivate.value = user
  showDeactivateDialog.value = true
}

const handleDeactivate = async () => {
  if (!userToDeactivate.value) return

  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ is_active: false })
      .eq('id', userToDeactivate.value.id)

    if (error) throw error

    await fetchUsers()
    showDeactivateDialog.value = false
    showNotification('success', 'Usuario desactivado')
    userToDeactivate.value = null
  } catch (error) {
    console.error('Error deactivating user:', error)
    showNotification('error', 'Error al desactivar el usuario')
  }
}

// --- Reactivate User ---
const handleReactivate = async (user: NewsPortalUser) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ is_active: true })
      .eq('id', user.id)

    if (error) throw error

    await fetchUsers()
    showNotification('success', 'Usuario reactivado')
  } catch (error) {
    console.error('Error reactivating user:', error)
    showNotification('error', 'Error al reactivar el usuario')
  }
}

// --- Delete User Permanently ---
const confirmDelete = (user: NewsPortalUser) => {
  userToDelete.value = user
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!userToDelete.value) return

  saving.value = true

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    if (!token) {
      showNotification('error', 'Sesión expirada. Vuelve a iniciar sesión.')
      return
    }

    await $fetch(`/api/admin/users/${userToDelete.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    await fetchUsers()
    showDeleteDialog.value = false
    showNotification('success', 'Usuario eliminado permanentemente')
    userToDelete.value = null
  } catch (err: any) {
    const message = err.data?.message || err.message || 'Error al eliminar el usuario'
    showNotification('error', message)
  } finally {
    saving.value = false
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

const isCurrentUser = (user: NewsPortalUser) => {
  return portalUser.value?.id === user.id
}

useHead({
  title: 'Usuarios - Admin',
})
</script>

<template>
  <div>
    <!-- Notifications -->
    <Teleport to="body">
      <Transition name="slide-down">
        <div
          v-if="successMessage"
          class="fixed top-4 right-4 z-[60] bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md"
        >
          <span>{{ successMessage }}</span>
        </div>
      </Transition>
      <Transition name="slide-down">
        <div
          v-if="errorMessage && !showCreateDialog"
          class="fixed top-4 right-4 z-[60] bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md"
        >
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>
    </Teleport>

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
        <Button @click="openCreateDialog">
          <UserPlus class="h-4 w-4 mr-2" />
          Crear usuario
        </Button>
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
                <AvatarFallback>{{ (user.name || user.email).charAt(0).toUpperCase() }}</AvatarFallback>
              </Avatar>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium">{{ user.name || user.email }}</span>
                  <Badge :class="getRoleColor(user.role)">
                    {{ getRoleLabel(user.role) }}
                  </Badge>
                  <Badge v-if="isCurrentUser(user)" variant="outline" class="text-primary border-primary">
                    T&uacute;
                  </Badge>
                </div>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{{ user.email }}</span>
                  <span>Desde {{ formatDate(user.created_at) }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div v-if="!isCurrentUser(user)" class="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" title="Editar" @click="openEditDialog(user)">
                  <Edit class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Desactivar"
                  @click="confirmDeactivate(user)"
                >
                  <Trash2 class="h-4 w-4 text-orange-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Eliminar permanentemente"
                  @click="confirmDelete(user)"
                >
                  <AlertTriangle class="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div v-else class="shrink-0">
                <Badge variant="outline" class="text-xs text-muted-foreground">Cuenta actual</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Create User Dialog -->
    <Teleport to="body">
      <div
        v-if="showCreateDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showCreateDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle>Crear Usuario</CardTitle>
              <Button variant="ghost" size="icon" @click="showCreateDialog = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <form @submit.prevent="handleCreate">
            <CardContent class="space-y-4">
              <!-- Error message inside modal -->
              <div v-if="errorMessage" class="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {{ errorMessage }}
              </div>

              <!-- Email -->
              <div class="space-y-2">
                <Label for="create-email">Email *</Label>
                <Input
                  id="create-email"
                  v-model="createForm.email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <!-- Password -->
              <div class="space-y-2">
                <Label for="create-password">Contrase&ntilde;a *</Label>
                <div class="relative">
                  <Input
                    id="create-password"
                    v-model="createForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="M&iacute;nimo 6 caracteres"
                    minlength="6"
                    required
                    class="pr-10"
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" class="h-4 w-4" />
                    <Eye v-else class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Role -->
              <div class="space-y-2">
                <Label>Rol *</Label>
                <Select v-model="createForm.role">
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
              <Button type="button" variant="outline" @click="showCreateDialog = false">
                Cancelar
              </Button>
              <Button type="submit" :disabled="saving">
                <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
                Crear
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Teleport>

    <!-- Edit Dialog -->
    <Teleport to="body">
      <div
        v-if="showEditDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showEditDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle>Editar Usuario</CardTitle>
              <Button variant="ghost" size="icon" @click="showEditDialog = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <form @submit.prevent="handleEdit">
            <CardContent class="space-y-4">
              <!-- Email (readonly) -->
              <div class="space-y-2">
                <Label for="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  v-model="editForm.email"
                  disabled
                  class="bg-muted"
                />
              </div>

              <!-- Full Name -->
              <div class="space-y-2">
                <Label for="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  v-model="editForm.full_name"
                  placeholder="Nombre del usuario"
                />
              </div>

              <!-- Role -->
              <div class="space-y-2">
                <Label>Rol</Label>
                <Select v-model="editForm.role">
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
              <Button type="button" variant="outline" @click="showEditDialog = false">
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

    <!-- Deactivate Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="showDeactivateDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeactivateDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Desactivar Usuario</CardTitle>
            <CardDescription>
              &iquest;Desactivar a "{{ userToDeactivate?.name || userToDeactivate?.email }}"? El usuario no podr&aacute; acceder al panel pero sus datos se conservar&aacute;n.
            </CardDescription>
          </CardHeader>
          <CardFooter class="flex justify-end gap-2">
            <Button variant="outline" @click="showDeactivateDialog = false">
              Cancelar
            </Button>
            <Button variant="destructive" @click="handleDeactivate">
              Desactivar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Teleport>

    <!-- Delete Permanently Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="showDeleteDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteDialog = false"
      >
        <Card class="w-full max-w-md mx-4">
          <CardHeader>
            <div class="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle class="h-5 w-5" />
              <CardTitle class="text-destructive">Eliminar Permanentemente</CardTitle>
            </div>
            <CardDescription>
              Esta acci&oacute;n es <strong>irreversible</strong>. Se eliminar&aacute; a "{{ userToDelete?.name || userToDelete?.email }}" del sistema y de la autenticaci&oacute;n. No podr&aacute; recuperarse.
            </CardDescription>
          </CardHeader>
          <CardFooter class="flex justify-end gap-2">
            <Button variant="outline" @click="showDeleteDialog = false">
              Cancelar
            </Button>
            <Button variant="destructive" :disabled="saving" @click="handleDelete">
              <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
              Eliminar permanentemente
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

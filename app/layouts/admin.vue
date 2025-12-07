<script setup lang="ts">
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Newspaper,
  ChevronDown,
} from 'lucide-vue-next'

const colorMode = useColorMode()
const route = useRoute()
const isSidebarOpen = ref(true)
const isMobileSidebarOpen = ref(false)

const { portalUser, signOut, fetchPortalUser, isAdmin } = usePortalAuth()

onMounted(() => {
  fetchPortalUser()
})

const toggleDark = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const navigation = computed(() => [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Noticias', href: '/admin/noticias', icon: FileText },
  { name: 'Categorías', href: '/admin/categorias', icon: FolderOpen },
  ...(isAdmin.value ? [{ name: 'Usuarios', href: '/admin/usuarios', icon: Users }] : []),
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
])

const isActive = (href: string) => {
  if (href === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(href)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isMobileSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="isMobileSidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300',
        isSidebarOpen ? 'w-64' : 'w-20',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-4 border-b">
        <NuxtLink to="/admin" class="flex items-center gap-2">
          <Newspaper class="h-8 w-8 text-primary shrink-0" />
          <span v-if="isSidebarOpen" class="font-display text-lg font-bold">Admin</span>
        </NuxtLink>
        <Button
          v-if="isSidebarOpen"
          variant="ghost"
          size="icon"
          class="hidden lg:flex"
          @click="isSidebarOpen = false"
        >
          <ChevronDown class="h-4 w-4 rotate-90" />
        </Button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
            isActive(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          ]"
          @click="isMobileSidebarOpen = false"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span v-if="isSidebarOpen">{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- User Section -->
      <div class="p-4 border-t">
        <div v-if="portalUser" :class="['flex items-center gap-3', !isSidebarOpen && 'justify-center']">
          <Avatar class="h-10 w-10">
            <AvatarImage :src="portalUser.avatar_url || ''" />
            <AvatarFallback>{{ portalUser.name?.charAt(0)?.toUpperCase() || 'U' }}</AvatarFallback>
          </Avatar>
          <div v-if="isSidebarOpen" class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ portalUser.name || portalUser.email }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ portalUser.email }}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          :class="['w-full mt-3 text-destructive hover:text-destructive', !isSidebarOpen && 'px-0']"
          @click="signOut"
        >
          <LogOut class="h-4 w-4" />
          <span v-if="isSidebarOpen" class="ml-2">Cerrar Sesión</span>
        </Button>
      </div>
    </aside>

    <!-- Main Content -->
    <div :class="['min-h-screen transition-all duration-300', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20']">
      <!-- Top Bar -->
      <header class="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            class="lg:hidden"
            @click="isMobileSidebarOpen = true"
          >
            <Menu class="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="hidden lg:flex"
            @click="isSidebarOpen = !isSidebarOpen"
          >
            <Menu class="h-5 w-5" />
          </Button>

          <h1 class="text-lg font-semibold">
            {{ navigation.find(item => isActive(item.href))?.name || 'Admin' }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="toggleDark">
            <Sun v-if="colorMode.value === 'dark'" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </Button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>


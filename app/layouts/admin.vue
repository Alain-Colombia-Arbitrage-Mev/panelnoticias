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
  ChevronLeft,
  ChevronRight,
  Bell,
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
  { name: 'Categorias', href: '/admin/categorias', icon: FolderOpen },
  ...(isAdmin.value ? [{ name: 'Usuarios', href: '/admin/usuarios', icon: Users }] : []),
  { name: 'Config', href: '/admin/configuracion', icon: Settings },
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
    <Transition name="fade">
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 z-40 bg-black/40 lg:hidden"
        @click="isMobileSidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300',
        isSidebarOpen ? 'w-64' : 'w-[72px]',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center h-14 px-4 border-b border-border" :class="isSidebarOpen ? 'justify-between' : 'justify-center'">
        <NuxtLink to="/admin" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Newspaper class="h-4 w-4 text-background" />
          </div>
          <Transition name="fade">
            <span v-if="isSidebarOpen" class="text-sm font-semibold tracking-tight">
              Panel de Noticias
            </span>
          </Transition>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative text-sm',
            isActive(item.href)
              ? 'bg-accent text-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            !isSidebarOpen && 'justify-center px-0',
          ]"
          @click="isMobileSidebarOpen = false"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          <span v-if="isSidebarOpen">{{ item.name }}</span>
          <!-- Tooltip when collapsed -->
          <div
            v-if="!isSidebarOpen"
            class="absolute left-full ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
          >
            {{ item.name }}
          </div>
        </NuxtLink>
      </nav>

      <!-- Collapse Toggle -->
      <div class="px-3 py-2 hidden lg:block border-t border-border">
        <button
          class="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          @click="isSidebarOpen = !isSidebarOpen"
        >
          <ChevronLeft v-if="isSidebarOpen" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>
      </div>

      <!-- User Section -->
      <div class="p-3 border-t border-border">
        <div v-if="portalUser" :class="['flex items-center gap-3 p-2 rounded-lg', !isSidebarOpen && 'justify-center']">
          <div class="relative">
            <Avatar class="h-8 w-8">
              <AvatarImage :src="portalUser.avatar_url || ''" />
              <AvatarFallback class="bg-muted text-muted-foreground text-xs font-semibold">
                {{ portalUser.name?.charAt(0)?.toUpperCase() || 'U' }}
              </AvatarFallback>
            </Avatar>
            <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card"></div>
          </div>
          <div v-if="isSidebarOpen" class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ portalUser.name || portalUser.email }}</p>
            <p class="text-xs text-muted-foreground truncate capitalize">{{ portalUser.role }}</p>
          </div>
        </div>

        <button
          :class="[
            'w-full mt-1 flex items-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
            !isSidebarOpen && 'justify-center',
          ]"
          @click="signOut"
        >
          <LogOut class="h-4 w-4" />
          <span v-if="isSidebarOpen">Salir</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div :class="['min-h-screen transition-all duration-300', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]']">
      <!-- Top Bar -->
      <header class="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div class="flex items-center justify-between h-14 px-4 lg:px-6">
          <div class="flex items-center gap-3">
            <button
              class="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
              @click="isMobileSidebarOpen = true"
            >
              <Menu class="h-5 w-5" />
            </button>

            <div>
              <h1 class="text-sm font-semibold">
                {{ navigation.find(item => isActive(item.href))?.name || 'Admin' }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              class="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
            >
              <Bell class="h-4 w-4" />
              <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive"></span>
            </button>
            <button
              class="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
              @click="toggleDark"
            >
              <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>
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

<template>
  <div class="min-h-screen bg-gray-50 font-sans text-gray-900">
    <!-- Top navbar -->
    <header class="bg-khilafat-900 text-white shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-khilafat-900 text-lg select-none">
            ب
          </div>
          <span class="text-lg font-bold tracking-wide">BaitulMal</span>
        </div>

        <!-- Nav links -->
        <nav class="flex items-center gap-1">
          <router-link
            to="/"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
            exact
          >Dashboard</router-link>
          <router-link
            to="/marketplace"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
          >Marketplace</router-link>
          <router-link
            to="/shura"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
          >Shura</router-link>
          <router-link
            v-if="isKhalifa"
            to="/admin"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
          >Admin</router-link>
        </nav>

        <!-- User area -->
        <div class="flex items-center gap-3">
          <template v-if="store.user.token">
            <div class="text-right hidden sm:block">
              <div class="text-sm font-semibold text-amber-400 leading-tight">{{ store.user.username || store.user.email || 'User' }}</div>
              <div class="text-xs text-khilafat-300">{{ store.user.role }}</div>
            </div>
            <div class="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-bold text-khilafat-900">
              {{ avatarInitial }}
            </div>
            <button @click="signOut" class="px-3 py-1.5 text-xs text-khilafat-300 hover:text-white hover:bg-khilafat-700 rounded-lg transition-colors">
              Sign out
            </button>
          </template>
          <router-link
            v-else
            to="/login"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-khilafat-900 font-semibold rounded-lg text-sm transition-colors"
          >Sign In</router-link>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from './stores/useStore'

const store = useStore()
const router = useRouter()

const isKhalifa = computed(() => store.user.role === 'KHALIFA')
const avatarInitial = computed(() => {
  const name = store.user.username || store.user.email || 'U'
  return name.charAt(0).toUpperCase()
})

function signOut() {
  localStorage.removeItem('token')
  store.setUser({ id: null, username: null, email: null, goldBalance: '0', reputationScore: 0, role: 'USER', token: null })
  router.push('/login')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back nav -->
    <router-link
      to="/members"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-khilafat-700 transition-colors"
    >← Back to Members</router-link>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex gap-6">
        <div class="w-20 h-20 rounded-full bg-gray-200 shrink-0"></div>
        <div class="flex-1 space-y-3 pt-2">
          <div class="h-6 bg-gray-200 rounded w-1/3"></div>
          <div class="h-3 bg-gray-100 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!profile" class="text-center py-24">
      <div class="text-5xl mb-4">🔍</div>
      <p class="text-lg font-semibold text-gray-700">User not found</p>
      <p class="text-sm text-gray-400 mt-1">The username "{{ $route.params.username }}" does not exist.</p>
    </div>

    <template v-else>
      <!-- Hero header -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <!-- Avatar -->
          <div
            class="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 select-none"
            :class="avatarBg(profile.role)"
          >{{ profile.username[0].toUpperCase() }}</div>

          <!-- Name + actions -->
          <div class="flex-1 text-center sm:text-left">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 class="text-2xl font-bold text-gray-900">{{ profile.username }}</h1>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                :class="roleBadge(profile.role)"
              >{{ profile.role }}</span>
            </div>
            <p v-if="profile.memberSince" class="text-sm text-gray-400">
              Member since {{ formatDate(profile.memberSince) }}
            </p>
            <!-- Self badge -->
            <div v-if="isSelf" class="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-khilafat-50 border border-khilafat-200 text-khilafat-700 text-xs font-semibold rounded-lg">
              👤 This is your profile
            </div>
            <!-- Send Gold button (others only) -->
            <router-link
              v-else
              :to="{ path: '/', query: { sendTo: profile.username } }"
              class="mt-4 inline-flex items-center gap-1.5 px-5 py-2 bg-khilafat-700 hover:bg-khilafat-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >↗ Send Gold</router-link>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Reputation -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Reputation</div>
          <div
            class="text-3xl font-bold"
            :class="profile.reputationScore >= 40 ? 'text-khilafat-700' : 'text-red-500'"
          >{{ profile.reputationScore }}</div>
          <div class="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-1.5 rounded-full transition-all"
              :class="repColor(profile.reputationScore)"
              :style="{ width: Math.min(100, Math.max(0, profile.reputationScore)) + '%' }"
            ></div>
          </div>
          <div class="mt-1 text-xs" :class="profile.reputationScore >= 40 ? 'text-khilafat-600' : 'text-red-500'">
            {{ profile.reputationScore >= 80 ? 'Trusted trader' : profile.reputationScore >= 40 ? 'Good standing' : 'Restricted' }}
          </div>
        </div>

        <!-- Gold balance -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Gold Balance</div>
          <div class="text-3xl font-bold text-amber-600">{{ toGrams(profile.goldBalance) }}<span class="text-base font-medium text-gray-400 ml-1">g</span></div>
          <div class="text-xs text-gray-400 mt-1">{{ profile.goldBalance }} mg</div>
        </div>

        <!-- Listings count -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 col-span-2 lg:col-span-1">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Active Listings</div>
          <div class="text-3xl font-bold text-gray-900">{{ profile.listings.length }}</div>
          <div class="text-xs text-gray-400 mt-1">Products in marketplace</div>
        </div>
      </div>

      <!-- Active listings -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Active Marketplace Listings</h2>
        <div v-if="profile.listings.length === 0" class="text-center py-10 text-sm text-gray-400">
          <div class="text-3xl mb-2">🏪</div>
          <p>No active listings</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="p in profile.listings"
            :key="p.id"
            class="border border-gray-200 rounded-xl p-4 hover:border-khilafat-200 hover:shadow-sm transition-all"
          >
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="font-semibold text-sm text-gray-900 leading-snug">{{ p.name }}</div>
              <div class="text-sm font-bold text-amber-600 shrink-0">{{ toGrams(p.price) }} g</div>
            </div>
            <p v-if="p.description" class="text-xs text-gray-400 mb-2 line-clamp-2">{{ p.description }}</p>
            <div class="text-xs text-gray-400">{{ p.stock }} in stock</div>
            <router-link
              to="/marketplace"
              class="mt-2 block text-center text-xs text-khilafat-600 hover:underline"
            >Go to Marketplace →</router-link>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useStore } from '../stores/useStore'

const route = useRoute()
const store = useStore()
const profile = ref(null)
const loading = ref(true)

const isSelf = computed(() => profile.value && store.user.username === profile.value.username)

onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get(
      `/api/user/profile/${encodeURIComponent(route.params.username)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    profile.value = res.data
  } catch (e) {
    console.warn('profile fetch', e)
  } finally {
    loading.value = false
  }
})

function toGrams(mg) {
  try { return (BigInt(mg || '0') / 1000n).toString() } catch { return '0' }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString([], { year: 'numeric', month: 'long' }) } catch { return '' }
}

function roleBadge(role) {
  if (role === 'KHALIFA') return 'bg-amber-100 text-amber-800'
  if (role === 'SHURA') return 'bg-khilafat-100 text-khilafat-800'
  return 'bg-gray-100 text-gray-600'
}

function avatarBg(role) {
  if (role === 'KHALIFA') return 'bg-amber-100 text-amber-700'
  if (role === 'SHURA') return 'bg-khilafat-100 text-khilafat-700'
  return 'bg-gray-100 text-gray-600'
}

function repColor(score) {
  const s = Number(score || 0)
  if (s < 40) return 'bg-red-400'
  if (s < 70) return 'bg-amber-400'
  return 'bg-khilafat-500'
}
</script>

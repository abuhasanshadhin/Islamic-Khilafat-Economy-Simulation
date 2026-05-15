<template>
  <div class="min-h-[75vh] flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
      <!-- Top banner -->
      <div class="bg-khilafat-900 px-8 py-7 text-center">
        <div class="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-3xl font-bold text-khilafat-900 mx-auto mb-3 select-none">
          ب
        </div>
        <h1 class="text-xl font-bold text-white">BaitulMal</h1>
        <p class="text-sm text-khilafat-300 mt-1">Islamic Digital Treasury</p>
      </div>

      <div class="px-8 py-6">
        <!-- Tab switcher -->
        <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            @click="mode = 'login'"
            :class="mode === 'login' ? 'bg-white shadow-sm text-khilafat-800 font-semibold' : 'text-gray-500 hover:text-gray-700'"
            class="flex-1 py-2 text-sm rounded-lg transition-all"
          >Sign In</button>
          <button
            @click="mode = 'register'"
            :class="mode === 'register' ? 'bg-white shadow-sm text-khilafat-800 font-semibold' : 'text-gray-500 hover:text-gray-700'"
            class="flex-1 py-2 text-sm rounded-lg transition-all"
          >Register</button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <!-- Username (register only) -->
          <div v-if="mode === 'register'">
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Username</label>
            <input
              v-model="form.username"
              type="text"
              autocomplete="username"
              required
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-500 focus:border-transparent transition-all"
              placeholder="your_username"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Email</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Password</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <!-- Error -->
          <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span>⚠</span><span>{{ error }}</span>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-khilafat-700 hover:bg-khilafat-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors mt-2"
          >
            {{ loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useStore } from '../stores/useStore'

const router = useRouter()
const store = useStore()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const form = ref({ username: '', email: '', password: '' })

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const endpoint = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register'
    const payload = mode.value === 'login'
      ? { email: form.value.email, password: form.value.password }
      : { username: form.value.username, email: form.value.email, password: form.value.password }

    const res = await axios.post(endpoint, payload)
    const data = res.data
    const token = data.token
    localStorage.setItem('token', token)
    store.setUser({ ...data.user, token })
    router.push('/')
  } catch (e) {
    const raw = e.response?.data?.error
    if (Array.isArray(raw)) {
      // Zod validation errors — show the first message
      error.value = raw.map(e => e.message).join('. ')
    } else {
      error.value = raw || 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

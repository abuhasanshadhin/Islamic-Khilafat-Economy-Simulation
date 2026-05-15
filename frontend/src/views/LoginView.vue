<template>
  <div
    class="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12"
  >
    <div
      class="w-full max-w-md rounded-4xl overflow-hidden shadow-2xl border border-slate-200 bg-white"
    >
      <div
        class="bg-linear-to-br from-khilafat-900 via-slate-900 to-khilafat-800 px-8 py-6 text-center text-white"
      >
        <div class="flex items-center justify-center mx-auto mb-3 shadow-inner">
          <div
            class="w-14 rounded-3xl bg-amber-400 text-2xl font-bold text-khilafat-900"
          >
            ب
          </div>
        </div>
        <h1 class="text-xl font-semibold">BaitulMal</h1>
        <p class="mt-1 text-sm text-slate-200">Islamic Digital Treasury</p>
      </div>

      <div class="px-8 py-6">
        <div class="flex gap-2 bg-slate-100 rounded-3xl p-1 mb-6">
          <button
            @click="mode = 'login'"
            :class="
              mode === 'login'
                ? 'bg-white shadow-sm text-khilafat-900 font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            "
            class="flex-1 rounded-3xl py-2 text-sm transition-all"
          >
            Sign In
          </button>
          <button
            @click="mode = 'register'"
            :class="
              mode === 'register'
                ? 'bg-white shadow-sm text-khilafat-900 font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            "
            class="flex-1 rounded-3xl py-2 text-sm transition-all"
          >
            Register
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-5">
          <div v-if="mode === 'register'" class="space-y-2">
            <label class="text-xs font-semibold text-slate-600 block"
              >Username</label
            >
            <input
              v-model="form.username"
              type="text"
              autocomplete="username"
              required
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-khilafat-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-khilafat-200 transition"
              placeholder="your_username"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-600 block"
              >Email</label
            >
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-khilafat-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-khilafat-200 transition"
              placeholder="you@example.com"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-600 block"
              >Password</label
            >
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-khilafat-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-khilafat-200 transition"
              placeholder="••••••••"
            />
          </div>

          <div
            v-if="error"
            class="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-2xl bg-khilafat-700 py-3 text-sm font-semibold text-white shadow-lg shadow-khilafat-500/10 transition hover:bg-khilafat-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {{
              loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"
            }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useStore } from "../stores/useStore";
import socket from "../socket";

const router = useRouter();
const store = useStore();

const mode = ref("login");
const loading = ref(false);
const error = ref("");
const form = ref({ username: "", email: "", password: "" });

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const endpoint =
      mode.value === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode.value === "login"
        ? { email: form.value.email, password: form.value.password }
        : {
            username: form.value.username,
            email: form.value.email,
            password: form.value.password,
          };

    const res = await axios.post(endpoint, payload);
    const data = res.data;
    const token = data.token;
    localStorage.setItem("token", token);
    store.setUser({ ...data.user, token });
    if (data.user?.id) socket.emit("identify", data.user.id);
    router.push("/");
  } catch (e) {
    const raw = e.response?.data?.error;
    if (Array.isArray(raw)) {
      // Zod validation errors — show the first message
      error.value = raw.map((e) => e.message).join(". ");
    } else {
      error.value = raw || "Something went wrong. Please try again.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

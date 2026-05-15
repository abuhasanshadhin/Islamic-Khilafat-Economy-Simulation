<template>
  <div class="min-h-screen bg-gray-50 font-sans text-gray-900">
    <!-- Top navbar -->
    <header class="bg-khilafat-900 text-white shadow-lg sticky top-0 z-50">
      <div
        class="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between h-16"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-khilafat-900 text-lg select-none"
          >
            ب
          </div>
          <span class="text-lg font-bold tracking-wide">BaitulMal</span>
        </div>

        <!-- Nav links -->
        <nav class="flex items-center gap-1">
          <router-link
            to="/state"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
            >State</router-link
          >
          <router-link
            to="/marketplace"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
            >Marketplace</router-link
          >
          <router-link
            to="/stocks"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
            >Stocks</router-link
          >
          <router-link
            to="/shura"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
            >Shura</router-link
          >
          <router-link
            to="/members"
            class="px-4 py-2 rounded-lg text-sm font-medium text-khilafat-200 hover:text-white hover:bg-khilafat-700 transition-colors"
            active-class="nav-active"
            >Members</router-link
          >
        </nav>

        <!-- User area -->
        <div class="flex items-center gap-3 relative" @click.stop>
          <template v-if="store.user.token">
            <button
              @click="toggleDropdown"
              class="flex items-center gap-3 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors"
              type="button"
            >
              <div class="text-right hidden sm:block">
                <div class="text-sm font-semibold text-amber-400 leading-tight">
                  {{ store.user.username || store.user.email || "User" }}
                </div>
                <div class="text-xs text-khilafat-300">
                  {{ store.user.role }}
                </div>
              </div>
              <div
                class="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-bold text-khilafat-900"
              >
                {{ avatarInitial }}
              </div>
            </button>

            <div
              v-if="dropdownOpen"
              @click.stop
              class="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white text-gray-800 shadow-xl border border-gray-200 overflow-hidden z-20"
            >
              <router-link
                to="/"
                class="block px-4 py-2 text-sm hover:bg-gray-100"
                @click="closeDropdown"
              >
                Dashboard
              </router-link>
              <router-link
                to="/send-gold"
                class="block px-4 py-2 text-sm hover:bg-gray-100"
                @click="closeDropdown"
              >
                Send Gold
              </router-link>
              <button
                @click="handleDropdownSignOut"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                type="button"
              >
                Sign out
              </button>
            </div>
          </template>
          <router-link
            v-else
            to="/login"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-khilafat-900 font-semibold rounded-lg text-sm transition-colors"
            >Sign In</router-link
          >
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <router-view />
    </main>

    <!-- Zakat deducted toast -->
    <transition name="slide-up">
      <div
        v-if="store.zakatToast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-purple-700 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm text-center"
        @click="store.setZakatToast(null)"
      >
        ◈ Zakat deducted:
        <strong>{{ mgToGrams(store.zakatToast.deducted) }} g</strong>. May Allah
        accept it.
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useStore } from "./stores/useStore";
import socket from "./socket";

const store = useStore();
const router = useRouter();
const dropdownOpen = ref(false);

const isKhalifa = computed(() => store.user.role === "KHALIFA");
const avatarInitial = computed(() => {
  const name = store.user.username || store.user.email || "U";
  return name.charAt(0).toUpperCase();
});

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}
function closeDropdown() {
  dropdownOpen.value = false;
}
function handleDropdownSignOut() {
  closeDropdown();
  signOut();
}
function onDocumentClick(event) {
  if (!dropdownOpen.value) return;
  closeDropdown();
}

function mgToGrams(mg) {
  try {
    return (BigInt(mg || "0") / 1000n).toString();
  } catch {
    return String(mg);
  }
}

// Rehydrate store from token on every page refresh
onMounted(async () => {
  const token = localStorage.getItem("token");
  if (!token || store.user.id) return;
  try {
    const [meRes, stateRes] = await Promise.all([
      axios.get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("/api/state/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    store.setUser({ ...meRes.data, token });
    store.setBaitulMal(stateRes.data);
    // emit identify so socket room is joined
    if (meRes.data?.id) socket.emit("identify", meRes.data.id);
  } catch {
    localStorage.removeItem("token");
  }

  // auto-dismiss zakat toast after 6s
  if (store.zakatToast) setTimeout(() => store.setZakatToast(null), 6000);
  document.addEventListener("click", onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick);
});

function signOut() {
  localStorage.removeItem("token");
  store.setUser({
    id: null,
    username: null,
    email: null,
    goldBalance: "0",
    reputationScore: 0,
    role: "USER",
    token: null,
  });
  store.setTransactions([]);
  router.push("/login");
}
</script>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Your personal treasury overview
        </p>
        <p class="text-xs text-gray-400 mt-2 max-w-2xl">
          Monitor your gold balance, reputation, role, and zakat eligibility at
          a glance. Use this page to stay informed about your current standing
          in the Khilafat economy.
        </p>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Gold Balance -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span
            class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
            >Gold Balance</span
          >
          <div
            class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm"
          >
            g
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900">
          {{ goldGrams
          }}<span class="text-base font-medium text-gray-400 ml-1">g</span>
        </div>
        <div class="text-xs text-gray-400 mt-1">{{ formattedMg }} mg</div>
      </div>

      <!-- Reputation -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span
            class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
            >Reputation</span
          >
          <div
            class="w-8 h-8 rounded-lg bg-khilafat-100 flex items-center justify-center text-khilafat-600 font-bold text-sm"
          >
            ★
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900">
          {{ user.reputationScore }}
        </div>
        <div class="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-1.5 rounded-full bg-khilafat-500 transition-all"
            :style="{ width: Math.min(100, user.reputationScore) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Role -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span
            class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
            >Role</span
          >
          <div
            class="w-8 h-8 rounded-lg bg-khilafat-100 flex items-center justify-center text-khilafat-600 text-sm"
          >
            👤
          </div>
        </div>
        <div class="text-xl font-bold text-khilafat-700">{{ user.role }}</div>
        <div class="text-xs text-gray-400 mt-1">Community rank</div>
      </div>

      <!-- Zakat -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span
            class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
            >Zakat</span
          >
          <div
            class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm"
          >
            ◈
          </div>
        </div>
        <div
          class="text-xl font-bold"
          :class="user.isZakatEligible ? 'text-green-600' : 'text-gray-400'"
        >
          {{ user.isZakatEligible ? "Eligible" : "N/A" }}
        </div>
        <div class="text-xs text-gray-400 mt-1">Annual obligation</div>
      </div>
    </div>

    <!-- Transactions + Listings row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Transactions -->
      <div
        class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col"
      >
        <h2 class="text-base font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h2>
        <div class="flex-1 space-y-2 overflow-auto max-h-64">
          <div
            v-if="transactions.length === 0"
            class="text-center py-10 text-sm text-gray-400"
          >
            <div class="text-2xl mb-2">📋</div>
            No transactions yet
          </div>
          <div
            v-for="tx in transactions"
            :key="tx.id"
            class="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                :class="txClass(tx.type)"
              >
                {{ txIcon(tx.type) }}
              </div>
              <div>
                <div class="text-xs font-semibold text-gray-800">
                  {{ tx.type }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatTime(tx.timestamp) }}
                </div>
              </div>
            </div>
            <div class="text-xs font-semibold text-khilafat-700 ml-2">
              {{ formatAmount(tx.amount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- My Listings -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold text-gray-900">My Listings</h2>
            <p class="text-xs text-gray-400 mt-0.5">
              Products you have listed in the marketplace
            </p>
          </div>
          <span class="text-xs text-gray-400"
            >{{ myProducts.length }} active</span
          >
        </div>
        <div
          v-if="myProducts.length === 0"
          class="text-center py-8 text-sm text-gray-400"
        >
          <div class="text-3xl mb-2">🏪</div>
          <p>No active listings.</p>
          <router-link
            to="/marketplace"
            class="text-khilafat-600 hover:underline text-xs mt-1 inline-block"
            >Go to Marketplace to list an item →</router-link
          >
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="p in myProducts"
            :key="p.id"
            class="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-900 truncate">
                {{ p.name }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ formatAmount(p.price) }} · {{ p.stock }} in stock
              </div>
            </div>
            <button
              @click="delistProduct(p.id)"
              class="ml-4 px-3 py-1 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors shrink-0"
            >
              Remove
            </button>
          </div>
        </div>
        <div
          v-if="listingMsg"
          class="mt-3 text-xs px-3 py-2 rounded-lg border"
          :class="
            listingMsg.ok
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          "
        >
          {{ listingMsg.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useStore } from "../stores/useStore";

const store = useStore();
const user = computed(() => store.user);
const transactions = computed(() => store.transactions);

const myProducts = ref([]);
const listingMsg = ref(null);

onMounted(async () => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const [meRes, txRes, myProductsRes] = await Promise.all([
      axios.get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("/api/user/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("/api/market/my-products", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    store.setUser({ ...meRes.data, token });
    store.setTransactions(txRes.data);
    myProducts.value = myProductsRes.data;
  } catch (e) {
    console.warn("Dashboard fetch", e);
  }
});

function formatMgToGramString(mgString) {
  try {
    const mg = BigInt(mgString || "0");
    const grams = mg / 1000n;
    const rem = mg % 1000n;
    if (rem === 0n) return grams.toString();
    const remStr = rem.toString().padStart(3, "0").replace(/0+$/, "");
    return `${grams}.${remStr}`;
  } catch {
    return String(mgString);
  }
}

const goldGrams = computed(() => formatMgToGramString(user.value.goldBalance));
const formattedMg = computed(() => user.value.goldBalance);

function formatAmount(amount) {
  try {
    return formatMgToGramString(amount) + " g";
  } catch {
    return String(amount);
  }
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

const txTypeMap = {
  TRADE: { bg: "bg-amber-100 text-amber-700", icon: "⇄" },
  TRANSFER: { bg: "bg-blue-100 text-blue-700", icon: "→" },
  GRANT: { bg: "bg-khilafat-100 text-khilafat-700", icon: "↓" },
  ZAKAT: { bg: "bg-purple-100 text-purple-700", icon: "◈" },
};
function txClass(type) {
  return (txTypeMap[type] || txTypeMap.TRANSFER).bg;
}
function txIcon(type) {
  return (txTypeMap[type] || txTypeMap.TRANSFER).icon;
}

async function delistProduct(productId) {
  const token = localStorage.getItem("token");
  try {
    await axios.delete(`/api/market/product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    myProducts.value = myProducts.value.filter((p) => p.id !== productId);
    listingMsg.value = { ok: true, text: "Listing removed" };
  } catch (e) {
    listingMsg.value = {
      ok: false,
      text: e.response?.data?.error || "Failed to remove listing",
    };
  }
  setTimeout(() => (listingMsg.value = null), 3000);
}
</script>

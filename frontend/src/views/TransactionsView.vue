<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">My Transactions</h1>
        <p class="text-sm text-gray-500 mt-1">
          Browse your full transaction history with pagination.
        </p>
      </div>
      <router-link
        to="/"
        class="text-sm font-semibold text-khilafat-700 hover:underline"
      >
        Back to dashboard
      </router-link>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900">Transactions</h2>
          <p class="text-xs text-gray-400">
            Showing your latest account activity.
          </p>
        </div>
        <div class="text-xs text-gray-500">
          {{ txMeta.rangeStart }}–{{ txMeta.rangeEnd }} of {{ txMeta.total }}
        </div>
      </div>

      <div
        v-if="transactions.length === 0"
        class="text-center py-12 text-sm text-gray-400"
      >
        <div class="text-3xl mb-3">📜</div>
        No transactions found.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                :class="txClass(tx.type)"
              >
                {{ txIcon(tx.type) }}
              </span>
              <div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ tx.type }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatTime(tx.timestamp) }}
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-500 mt-2">
              From <strong>#{{ tx.senderId }}</strong> to
              <strong>#{{ tx.receiverId }}</strong>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-khilafat-700">
              {{ formatAmount(tx.amount) }}
            </div>
          </div>
        </div>
      </div>

      <Pagination
        v-if="txMeta.totalPages > 1"
        :meta="txMeta"
        @prev="fetchTransactions(txPage - 1)"
        @next="fetchTransactions(txPage + 1)"
        @goto="fetchTransactions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Pagination from "../components/Pagination.vue";

const transactions = ref([]);
const txPage = ref(1);
const txMeta = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  rangeStart: 0,
  rangeEnd: 0,
});

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchTransactions(page = 1) {
  if (page < 1) return;
  try {
    const res = await axios.get("/api/user/transactions", {
      headers: authHeader(),
      params: { page, limit: txMeta.value.limit },
    });
    transactions.value = res.data.items || [];
    if (res.data.meta) {
      txMeta.value = res.data.meta;
      txPage.value = res.data.meta.page;
    }
  } catch (e) {
    console.warn("Failed to fetch transactions", e);
  }
}

function formatAmount(amount) {
  try {
    const mg = BigInt(amount || "0");
    const grams = mg / 1000n;
    const rem = mg % 1000n;
    if (rem === 0n) return `${grams.toString()} g`;
    return `${grams.toString()}.${rem.toString().padStart(3, "0").replace(/0+$/, "")} g`;
  } catch {
    return String(amount);
  }
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
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

onMounted(() => fetchTransactions(txPage.value));
</script>

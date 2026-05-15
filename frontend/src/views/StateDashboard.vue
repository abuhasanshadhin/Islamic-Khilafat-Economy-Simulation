<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-khilafat-900">State Dashboard</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Public state treasury metrics anyone can view
      </p>
      <p class="text-xs text-gray-400 mt-2 max-w-2xl">
        View the BaitulMal reserves and resource prices published by the state.
        This page is meant for transparency and public accountability.
      </p>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
    >
      <strong>Unable to load public state data.</strong>
      <p class="text-sm mt-2">{{ error }}</p>
    </div>

    <div
      v-if="loading"
      class="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500"
    >
      Loading public state metrics…
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div
        class="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-semibold text-gray-900">
              BaitulMal Reserves
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">
              Public reserve totals for the state treasury
            </p>
          </div>
          <span
            class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
            >Public</span
          >
        </div>

        <div class="grid grid-cols-3 gap-4 mb-5">
          <div
            class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center"
          >
            <div
              class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2"
            >
              Gold
            </div>
            <div class="text-2xl font-bold text-amber-700">
              {{ formatMgToGrams(stats.goldReserve) }}
            </div>
            <div class="text-xs text-amber-500 font-medium">g</div>
            <div class="text-xs text-gray-400 mt-1">
              {{ stats.goldReserve }} mg
            </div>
          </div>
          <div
            class="bg-khilafat-50 border border-khilafat-100 rounded-xl p-4 text-center"
          >
            <div
              class="text-xs font-semibold text-khilafat-600 uppercase tracking-wide mb-2"
            >
              Oil
            </div>
            <div class="text-2xl font-bold text-khilafat-700">
              {{ numberOrDash(stats.oilReserve) }}
            </div>
            <div class="text-xs text-khilafat-500 font-medium">L</div>
          </div>
          <div
            class="bg-khilafat-50 border border-khilafat-100 rounded-xl p-4 text-center"
          >
            <div
              class="text-xs font-semibold text-khilafat-600 uppercase tracking-wide mb-2"
            >
              Gas
            </div>
            <div class="text-2xl font-bold text-khilafat-700">
              {{ numberOrDash(stats.gasReserve) }}
            </div>
            <div class="text-xs text-khilafat-500 font-medium">m³</div>
          </div>
        </div>

        <div class="border-t border-gray-100 pt-4">
          <p class="text-xs uppercase tracking-wide text-gray-400 mb-3">
            Total Zakat Collected
          </p>
          <div class="flex items-end justify-between gap-4">
            <div>
              <div class="text-3xl font-bold text-gray-900">
                {{ formatMgToGrams(stats.totalZakatCollected) }} g
              </div>
              <div class="text-xs text-gray-500">
                Since the state treasury opened
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400">Live public snapshot</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-semibold text-gray-900">Market Prices</h2>
            <p class="text-xs text-gray-400 mt-0.5">
              Latest prices for public resources
            </p>
          </div>
          <span
            class="text-xs font-semibold text-khilafat-700 bg-khilafat-100 rounded-full px-2 py-1"
            >Updated live</span
          >
        </div>

        <div class="space-y-3">
          <div v-if="prices.length === 0" class="text-sm text-gray-400">
            No price data available yet.
          </div>
          <div
            v-for="item in prices"
            :key="item.resource"
            class="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div>
              <div class="text-xs uppercase tracking-wide text-gray-500">
                {{ item.resource }}
              </div>
              <div class="text-sm text-gray-700">
                {{
                  item.updatedAt
                    ? new Date(item.updatedAt).toLocaleString()
                    : "Unknown"
                }}
              </div>
            </div>
            <div class="text-lg font-semibold text-khilafat-700">
              {{ item.priceInGoldMg.toLocaleString() }} mg
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const stats = ref({
  goldReserve: "0",
  oilReserve: "0",
  gasReserve: "0",
  totalZakatCollected: "0",
});
const prices = ref([]);
const loading = ref(true);
const error = ref(null);

function formatMgToGrams(value) {
  try {
    const mg = BigInt(value || "0");
    const grams = mg / 1000n;
    const rem = mg % 1000n;
    if (rem === 0n) return grams.toString();
    const remStr = rem.toString().padStart(3, "0").replace(/0+$/, "");
    return `${grams}.${remStr}`;
  } catch {
    return String(value);
  }
}

function numberOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString();
}

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    const [stateRes, pricesRes] = await Promise.all([
      axios.get("/api/state/stats"),
      axios.get("/api/market/prices"),
    ]);
    stats.value = stateRes.data;
    prices.value = pricesRes.data;
  } catch (err) {
    error.value =
      err.response?.data?.error || "Failed to load public state data.";
  } finally {
    loading.value = false;
  }
});
</script>

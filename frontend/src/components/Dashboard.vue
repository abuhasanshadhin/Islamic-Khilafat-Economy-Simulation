<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Gold Wallet Card -->
    <section class="col-span-1 bg-white border rounded-lg p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-khilafat-700">Gold Wallet</h2>
          <p class="text-sm text-gray-500">Your available gold</p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold text-amber-600">{{ goldGrams }} g</div>
          <div class="text-sm text-gray-600">{{ formattedMg }} mg</div>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-khilafat-500 flex items-center justify-center text-white"
          >
            G
          </div>
          <div>
            <div class="text-sm text-gray-500">Reputation</div>
            <div class="text-lg font-medium text-khilafat-700">
              {{ user.reputationScore }}
            </div>
          </div>
        </div>
        <div>
          <button class="px-3 py-1 bg-amber-500 text-white rounded-md">
            Receive
          </button>
        </div>
      </div>
    </section>

    <!-- Baitul Mal Stats -->
    <section
      class="col-span-1 lg:col-span-2 bg-white border rounded-lg p-6 shadow-sm"
    >
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-khilafat-700">
            BaitulMal Reserves
            <span
              class="ml-3 inline-flex items-center gap-2 text-sm text-gray-500"
              ><span class="live-dot"></span> Live</span
            >
          </h2>
          <p class="text-sm text-gray-500">State reserves (real-time)</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 bg-khilafat-50 rounded-md">
          <div class="text-sm text-gray-500">Gold</div>
          <div class="text-2xl font-bold text-khilafat-700">
            {{ baitulGoldGrams }} g
          </div>
          <div class="text-xs text-gray-500">
            {{ baitul.baitulMal?.goldReserve ?? baitulGoldMg }} mg
          </div>
        </div>
        <div class="p-4 bg-khilafat-50 rounded-md">
          <div class="text-sm text-gray-500">Oil</div>
          <div class="text-2xl font-bold text-khilafat-700">
            {{ baitulOil }} L
          </div>
        </div>
        <div class="p-4 bg-khilafat-50 rounded-md">
          <div class="text-sm text-gray-500">Gas</div>
          <div class="text-2xl font-bold text-khilafat-700">
            {{ baitulGas }} m³
          </div>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-sm font-medium text-gray-700 mb-2">
          Recent Transactions
        </h3>
        <div class="space-y-2 max-h-48 overflow-auto">
          <div
            v-for="tx in transactions"
            :key="tx.id"
            class="p-2 border rounded-md bg-gray-50 flex items-center justify-between"
          >
            <div>
              <div class="text-sm font-semibold">{{ tx.type }}</div>
              <div class="text-xs text-gray-500">{{ tx.timestamp }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm text-khilafat-700">
                {{ formatAmount(tx.amount) }}
              </div>
            </div>
          </div>
          <div v-if="transactions.length === 0" class="text-sm text-gray-500">
            No recent transactions
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "../stores/useStore";

const store = useStore();

// Reactive refs
const user = computed(() => store.user);
const baitul = computed(() => ({ baitulMal: store.baitulMal }));
const transactions = computed(() => store.transactions);

function formatMgToGramString(mgString) {
  try {
    const mg = BigInt(mgString || "0");
    const grams = mg / 1000n;
    const rem = mg % 1000n;
    const remStr = rem.toString().padStart(3, "0");
    // trim trailing zeros for neatness
    if (rem === 0n) return grams.toString();
    // show one decimal if rem divisible by 100
    const decimal = remStr.replace(/0+$/, "");
    return `${grams.toString()}.${decimal}`;
  } catch (e) {
    return String(mgString);
  }
}

const goldGrams = computed(() => formatMgToGramString(user.value.goldBalance));
const formattedMg = computed(() => user.value.goldBalance);

const baitulGoldMg = computed(() => store.baitulMal.goldReserve);
const baitulGoldGrams = computed(() =>
  formatMgToGramString(baitulGoldMg.value),
);
const baitulOil = computed(() => Number(store.baitulMal.oilReserve).toFixed(2));
const baitulGas = computed(() => Number(store.baitulMal.gasReserve).toFixed(2));

function formatAmount(amount) {
  if (!amount) return "0";
  // amount likely string (mg) or bigint string
  try {
    return formatMgToGramString(amount) + " g";
  } catch (e) {
    return String(amount);
  }
}

// script-setup exports removed; template accesses reactive refs directly
</script>

<style scoped>
.live-dot {
  display: inline-block;
}
</style>

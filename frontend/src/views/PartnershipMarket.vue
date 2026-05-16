<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-khilafat-900">
        Khilafat Partnership Market
      </h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Halal Khilafat partnership trading — no riba, no unjust gain
      </p>
      <p class="text-xs text-gray-400 mt-2 max-w-2xl">
        Partner in public Musharaka contracts with live pricing. Only trusted
        members with sufficient reputation may launch a partnership.
      </p>
    </div>

    <!-- Resource Prices Ticker -->
    <div class="bg-khilafat-900 rounded-xl p-4 flex flex-wrap gap-6">
      <div
        v-for="resource in ['GOLD', 'OIL', 'GAS']"
        :key="resource"
        class="flex items-center gap-3"
      >
        <span
          class="text-xs font-bold text-khilafat-300 uppercase tracking-wider"
          >{{ resource }}</span
        >
        <span class="text-lg font-bold text-amber-400">{{
          priceDisplay(resource)
        }}</span>
        <span class="text-xs text-khilafat-400">mg/unit</span>
        <span
          v-if="priceEvent(resource)"
          class="text-xs text-amber-300 italic"
          >{{ priceEvent(resource) }}</span
        >
      </div>
      <div class="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
        <span class="live-dot"></span> Live prices
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Listed Partnerships -->
      <div class="lg:col-span-2 space-y-4">
        <h2 class="text-base font-semibold text-gray-900">
          Active Partnerships
        </h2>

        <div
          v-if="stocks.length === 0"
          class="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center"
        >
          <div class="text-4xl mb-3">📈</div>
          <p class="text-gray-500 font-medium">No partnerships listed yet</p>
          <p class="text-sm text-gray-400 mt-1">
            {{
              isLoggedIn
                ? canLaunchPartnership
                  ? "Be the first to offer a public partnership"
                  : "Need reputation > 80 to launch a partnership"
                : "Sign in to join partnerships"
            }}
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="s in stocks"
            :key="s.id"
            class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-khilafat-200 hover:shadow-md transition-all"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-gray-900">{{ s.name }}</h3>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full bg-khilafat-100 text-khilafat-700 font-medium"
                    >Partnership #{{ s.id }}</span
                  >
                </div>
                <div class="flex flex-wrap gap-4 text-xs text-gray-500 mt-1.5">
                  <span
                    >Price:
                    <strong class="text-amber-600"
                      >{{ toGrams(s.sharePrice) }} g/share</strong
                    ></span
                  >
                  <span
                    >Available:
                    <strong class="text-gray-800"
                      >{{ s.availableShares }} / {{ s.totalShares }}</strong
                    ></span
                  >
                  <span
                    >Owner:
                    <strong class="text-khilafat-700"
                      >#{{ s.ownerId }}</strong
                    ></span
                  >
                </div>
                <!-- Share availability bar -->
                <div
                  class="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"
                >
                  <div
                    class="h-1.5 rounded-full bg-khilafat-500 transition-all"
                    :style="{
                      width:
                        100 - (s.availableShares / s.totalShares) * 100 + '%',
                    }"
                  ></div>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  {{
                    Math.round((1 - s.availableShares / s.totalShares) * 100)
                  }}% sold
                </p>
              </div>

              <!-- Buy controls -->
              <div
                v-if="isLoggedIn && s.ownerId !== store.user.id"
                class="flex flex-col gap-2 shrink-0 min-w-35"
              >
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    v-model.number="buyForm[s.id]"
                    min="1"
                    :max="s.availableShares"
                    class="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-khilafat-400"
                  />
                  <button
                    @click="buyShares(s)"
                    :disabled="!s.availableShares"
                    class="flex-1 py-1.5 px-3 bg-khilafat-700 hover:bg-khilafat-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Buy
                  </button>
                </div>
                <p class="text-xs text-gray-400">
                  Cost:
                  {{
                    toGrams(BigInt(s.sharePrice) * BigInt(buyForm[s.id] || 1))
                  }}
                  g
                </p>
              </div>
              <div
                v-else-if="isLoggedIn && s.ownerId === store.user.id"
                class="shrink-0"
              >
                <div class="flex flex-col gap-2">
                  <span class="text-xs text-khilafat-600 font-semibold"
                    >Your partnership</span
                  >
                  <div class="flex gap-2 items-center">
                    <input
                      type="number"
                      v-model.number="dividendForm[s.id]"
                      min="1"
                      class="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="mg"
                    />
                    <button
                      @click="distributeDividends(s)"
                      class="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Distribute
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: Partnership Form -->
      <aside class="lg:col-span-1 space-y-4">
        <!-- Partnership Form (rep > 80) -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 class="text-base font-semibold text-gray-900 mb-1">
            Launch Public Partnership
          </h3>
          <p class="text-xs text-gray-400 mb-4">
            Requires reputation score &gt; 80
          </p>

          <div v-if="!isLoggedIn" class="text-center py-4">
            <router-link
              to="/login"
              class="text-sm text-khilafat-600 hover:underline"
              >Sign in to offer a partnership</router-link
            >
          </div>
          <div
            v-else-if="!canLaunchPartnership"
            class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"
          >
            Your reputation ({{ store.user.reputationScore }}) must exceed 80 to
            launch a partnership.
          </div>
          <form v-else @submit.prevent="launchPartnership" class="space-y-3">
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1"
                >Company Name</label
              >
              <input
                v-model="partnershipForm.name"
                required
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1"
                >Total Shares</label
              >
              <input
                v-model.number="partnershipForm.totalShares"
                type="number"
                min="1"
                required
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                placeholder="1000"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1"
                >Price per share (mg)</label
              >
              <input
                v-model.number="partnershipForm.initialPriceMg"
                type="number"
                min="1"
                required
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                placeholder="100"
              />
            </div>
            <button
              type="submit"
              :disabled="partnershipLoading"
              class="w-full py-2 bg-khilafat-700 hover:bg-khilafat-600 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {{ partnershipLoading ? "Launching…" : "🚀 Launch Partnership" }}
            </button>
          </form>
        </div>

        <!-- Your Holdings -->
        <div
          v-if="isLoggedIn"
          class="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
        >
          <h3 class="text-sm font-semibold text-gray-900 mb-3">My Holdings</h3>
          <div
            v-if="myHoldings.length === 0"
            class="text-xs text-gray-400 text-center py-4"
          >
            No shares yet
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="h in myHoldings"
              :key="h.stockId"
              class="flex items-center justify-between text-xs px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
            >
              <span class="font-semibold text-gray-800">{{ h.stockName }}</span>
              <span class="text-khilafat-700 font-bold"
                >{{ h.shares }} shares</span
              >
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "../stores/useStore";
import axios from "axios";
import { showSuccessToast, showErrorToast } from "../utils/toast";

const store = useStore();
const stocks = ref([]);
const myHoldings = ref([]);
const buyForm = ref({});
const dividendForm = ref({});
const partnershipForm = ref({
  name: "",
  totalShares: 1000,
  initialPriceMg: 100,
});
const partnershipLoading = ref(false);

const isLoggedIn = computed(() => !!store.user.token);
const canLaunchPartnership = computed(
  () => Number(store.user.reputationScore) > 80,
);

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("token") || ""}` };
}

function toGrams(mgVal) {
  try {
    const mg = BigInt(mgVal);
    const g = mg / 1000n;
    const rem = mg % 1000n;
    if (rem === 0n) return g.toString();
    return `${g}.${rem.toString().padStart(3, "0").replace(/0+$/, "")}`;
  } catch {
    return String(mgVal);
  }
}

function priceDisplay(resource) {
  const p = store.prices[resource];
  if (!p) return "—";
  return p.priceInGoldMg ? Number(p.priceInGoldMg).toLocaleString() : "—";
}

function priceEvent(resource) {
  return store.prices[resource]?.event ?? null;
}

async function loadStocks() {
  try {
    const res = await axios.get("/api/partnership");
    stocks.value = res.data;
    stocks.value.forEach((s) => {
      if (!buyForm.value[s.id]) buyForm.value[s.id] = 1;
      if (!dividendForm.value[s.id]) dividendForm.value[s.id] = 1000;
    });
    // Compute holdings
    if (store.user.id) {
      myHoldings.value = res.data
        .filter((s) => s.holdings?.some((h) => h.userId === store.user.id))
        .map((s) => {
          const h = s.holdings?.find((h) => h.userId === store.user.id);
          return {
            stockId: s.id,
            stockName: s.name,
            shares: h?.shares ?? 0,
          };
        });
    }
  } catch (e) {
    console.warn("loadStocks", e);
  }
}

async function loadPrices() {
  try {
    const res = await axios.get("/api/market/prices");
    store.setPrices(res.data);
  } catch (e) {
    console.warn("loadPrices", e);
  }
}

async function buyShares(stock) {
  const shares = buyForm.value[stock.id] || 1;
  try {
    await axios.post(
      "/api/partnership/buy",
      { partnershipId: stock.id, shares },
      { headers: authHeader() },
    );
    showSuccessToast(`Bought ${shares} shares of ${stock.name}`);
    loadStocks();
  } catch (e) {
    showErrorToast(e.response?.data?.error || "Purchase failed");
  }
}

async function distributeDividends(stock) {
  const totalAmountMg = dividendForm.value[stock.id] || 1000;
  try {
    await axios.post(
      "/api/partnership/distribute",
      { partnershipId: stock.id, totalAmountMg },
      { headers: authHeader() },
    );
    showSuccessToast(
      `Distributed ${totalAmountMg}mg dividends for ${stock.name}`,
    );
    loadStocks();
  } catch (e) {
    showErrorToast(e.response?.data?.error || "Distribution failed");
  }
}

async function launchPartnership() {
  partnershipLoading.value = true;
  try {
    await axios.post(
      "/api/partnership/partnership",
      {
        name: partnershipForm.value.name,
        totalShares: partnershipForm.value.totalShares,
        initialPriceMg: partnershipForm.value.initialPriceMg,
      },
      { headers: authHeader() },
    );
    showSuccessToast(
      `${partnershipForm.value.name} is now publicly offered as a partnership!`,
    );
    partnershipForm.value = {
      name: "",
      totalShares: 1000,
      initialPriceMg: 100,
    };
    loadStocks();
  } catch (e) {
    showErrorToast(e.response?.data?.error || "Partnership launch failed");
  } finally {
    partnershipLoading.value = false;
  }
}

// Reload on socket-triggered stock refresh
watch(
  () => store.stockRefreshKey,
  () => loadStocks(),
);

onMounted(() => {
  loadStocks();
  loadPrices();
});
</script>

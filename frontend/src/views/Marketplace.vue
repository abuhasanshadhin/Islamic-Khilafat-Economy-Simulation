<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-khilafat-900">Marketplace</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Browse and trade goods with gold
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Products grid -->
      <div :class="isLoggedIn ? 'lg:col-span-3' : 'lg:col-span-4'">
        <div
          v-if="products.length === 0"
          class="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center"
        >
          <div class="text-5xl mb-4">🏪</div>
          <p class="text-gray-500 font-medium">No products listed yet</p>
          <p class="text-sm text-gray-400 mt-1">
            {{
              isLoggedIn
                ? "Be the first to list an item"
                : "Sign in to list or buy items"
            }}
          </p>
        </div>
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            v-for="product in products"
            :key="product.id"
            class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-khilafat-200 transition-all"
          >
            <!-- Placeholder banner -->
            <div
              class="h-20 bg-linear-to-br from-khilafat-100 via-khilafat-50 to-amber-50 flex items-center justify-center text-4xl"
            >
              📦
            </div>
            <div class="p-4">
              <div class="flex items-start justify-between mb-1">
                <h3 class="font-semibold text-gray-900 text-sm leading-snug">
                  {{ product.name }}
                </h3>
                <div class="ml-2 shrink-0 text-right">
                  <div class="text-base font-bold text-amber-600">
                    {{ formatPrice(product.price)
                    }}<span class="text-xs ml-0.5">g</span>
                  </div>
                </div>
              </div>
              <p
                v-if="product.description"
                class="text-xs text-gray-400 mb-3 line-clamp-2"
              >
                {{ product.description }}
              </p>

              <!-- Seller reputation bar -->
              <div class="mb-4">
                <div
                  class="flex items-center justify-between text-xs text-gray-400 mb-1"
                >
                  <span>Seller trust · {{ product.sellerName }}</span>
                  <span
                    class="font-medium"
                    :class="trustTextColor(product.sellerReputation)"
                    >{{ product.sellerReputation || 0 }}</span
                  >
                </div>
                <div
                  class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"
                >
                  <div
                    :style="{
                      width: trustWidth(product.sellerReputation) + '%',
                    }"
                    :class="trustColor(product.sellerReputation)"
                    class="h-1.5 rounded-full transition-all"
                  ></div>
                </div>
              </div>

              <!-- Buy controls: only for authenticated users who don't own the item -->
              <template v-if="isLoggedIn && product.ownerId !== store.user.id">
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    v-model.number="quantities[product.id]"
                    min="1"
                    :max="product.stock"
                    class="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                  />
                  <button
                    @click="buyNow(product)"
                    class="flex-1 py-1.5 bg-khilafat-700 hover:bg-khilafat-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </template>
              <template
                v-else-if="isLoggedIn && product.ownerId === store.user.id"
              >
                <div class="text-xs text-gray-400 italic">Your listing</div>
              </template>
              <template v-else>
                <router-link
                  to="/login"
                  class="block text-center text-xs text-khilafat-600 hover:underline mt-1"
                  >Sign in to buy</router-link
                >
              </template>
              <div class="text-xs text-gray-400 mt-2">
                {{ product.stock }} in stock
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: List an Item — authenticated users with rep >= 40 only -->
      <aside v-if="isLoggedIn" class="lg:col-span-1">
        <div
          class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-24"
        >
          <h3 class="text-base font-semibold text-gray-900 mb-1">
            List an Item
          </h3>
          <p class="text-xs text-gray-400 mb-4">Sell goods for gold</p>

          <!-- Reputation restriction notice -->
          <div
            v-if="isReputationRestricted"
            class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-3"
          >
            ⚠ Your reputation score ({{ store.user.reputationScore }}) is below
            40. Marketplace listing is restricted.
          </div>

          <form v-else @submit.prevent="listItem" class="space-y-3">
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1"
                >Name</label
              >
              <input
                v-model="form.name"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                placeholder="Item name"
                required
              />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1"
                >Description</label
              >
              <input
                v-model="form.description"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1"
                >Price (g)</label
              >
              <input
                v-model.number="form.priceGrams"
                type="number"
                step="0.001"
                min="0.001"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                placeholder="0.000"
                required
              />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1"
                >Stock</label
              >
              <input
                v-model.number="form.stock"
                type="number"
                min="1"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
                placeholder="1"
                required
              />
            </div>
            <button
              class="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              + List Item
            </button>
          </form>

          <div
            v-if="validationError"
            class="mt-4 p-3 rounded-lg text-sm border bg-red-50 text-red-700 border-red-200"
          >
            {{ validationError }}
          </div>
        </div>
      </aside>

      <!-- Guest CTA -->
      <aside v-else class="lg:col-span-1">
        <div
          class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center"
        >
          <div class="text-3xl mb-3">🔒</div>
          <p class="text-sm font-semibold text-gray-700 mb-1">
            Sign in to trade
          </p>
          <p class="text-xs text-gray-400 mb-4">
            Register to list items and buy from the marketplace
          </p>
          <router-link
            to="/login"
            class="block w-full py-2 bg-khilafat-700 hover:bg-khilafat-600 text-white font-semibold rounded-lg text-sm transition-colors"
            >Sign In</router-link
          >
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "../stores/useStore";
import socket from "../socket";
import axios from "axios";
import { showSuccessToast, showErrorToast } from "../utils/toast";

const store = useStore();
const products = ref([]);
const quantities = ref({});
const validationError = ref("");

const form = ref({ name: "", description: "", priceGrams: null, stock: 1 });

const isLoggedIn = computed(() => !!store.user.token);
const isReputationRestricted = computed(
  () => Number(store.user.reputationScore) < 40,
);

async function loadProducts() {
  try {
    const res = await axios.get("/api/market/products");
    const data = res.data;
    products.value = data;
    data.forEach((p) => {
      quantities.value[p.id] = 1;
    });
  } catch (e) {
    console.warn("loadProducts", e);
  }
}

function formatPrice(priceMg) {
  try {
    // priceMg may be string
    const mg = BigInt(priceMg);
    return (mg / 1000n).toString();
  } catch (e) {
    return String(priceMg);
  }
}

function trustWidth(score) {
  const s = Number(score || 0);
  return Math.min(100, Math.max(0, s));
}

function trustColor(score) {
  const s = Number(score || 0);
  if (s < 40) return "bg-red-500";
  if (s < 70) return "bg-amber-500";
  return "bg-khilafat-600";
}

function trustTextColor(score) {
  const s = Number(score || 0);
  if (s < 40) return "text-red-600";
  if (s < 70) return "text-amber-600";
  return "text-khilafat-600";
}

async function buyNow(product) {
  const qty = quantities.value[product.id] || 1;
  const token = localStorage.getItem("token");
  try {
    const res = await axios.post(
      "/api/trade/purchase",
      { productId: product.id, quantity: qty },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    const body = res.data;

    // optimistic balance update
    try {
      const priceMg = BigInt(body.totalPrice || product.price * BigInt(qty));
      const newBalance = (BigInt(store.user.goldBalance) - priceMg).toString();
      store.setUser({ goldBalance: newBalance });
    } catch (e) {}

    showSuccessToast("Purchase successful");
    // add transaction locally
    store.addTransaction({
      id: Date.now(),
      type: "TRADE",
      amount: body.totalPrice || String(product.price),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("buyNow", e);
    showErrorToast(e.response?.data?.error || "Purchase failed");
  }
}

async function listItem() {
  try {
    validationError.value = "";
    const token = localStorage.getItem("token");
    const priceMg = BigInt(Math.round((form.value.priceGrams || 0) * 1000));
    if (priceMg <= 0n) {
      validationError.value = "Price must be > 0";
      return;
    }

    const res = await axios.post(
      "/api/market/list",
      {
        name: form.value.name,
        description: form.value.description,
        price: priceMg.toString(),
        stock: form.value.stock,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    if (res.status >= 400) throw new Error("list failed");
    showSuccessToast("Item listed");
    validationError.value = "";
    form.value = { name: "", description: "", priceGrams: null, stock: 1 };
    loadProducts();
  } catch (e) {
    console.error("listItem", e);
    showErrorToast(e.response?.data?.error || "Listing failed");
  }
}

onMounted(() => {
  loadProducts();
});

watch(() => store.marketRefreshKey, loadProducts);
</script>

<style scoped>
.transition-toast-enter-active {
  transition: opacity 0.25s ease;
}
.transition-toast-leave-active {
  transition: opacity 0.25s ease;
}
</style>

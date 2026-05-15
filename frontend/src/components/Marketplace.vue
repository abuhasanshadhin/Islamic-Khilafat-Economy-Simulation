<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="col-span-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="product in products"
          :key="product.id"
          class="p-4 bg-white border rounded-md shadow-sm"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-khilafat-700">
                {{ product.name }}
              </h3>
              <div class="text-xs text-gray-500">{{ product.description }}</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-amber-500">
                {{ formatPrice(product.price) }} g
              </div>
              <div class="text-xs text-gray-500">
                Stock: {{ product.stock }}
              </div>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <div>
              <div class="text-xs text-gray-500">Seller Reputation</div>
              <div class="w-32 mt-1">
                <div class="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    :style="{
                      width: trustWidth(product.sellerReputation) + '%',
                    }"
                    :class="trustColor(product.sellerReputation)"
                    class="h-2 rounded-full"
                  ></div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="number"
                v-model.number="quantities[product.id]"
                min="1"
                class="w-20 p-1 border rounded"
              />
              <button
                class="px-3 py-1 bg-khilafat-600 text-white rounded-md"
                @click="buyNow(product)"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <aside class="col-span-1 bg-white border rounded-md p-4 shadow-sm">
      <h3 class="text-lg font-semibold text-khilafat-700">List an Item</h3>
      <form @submit.prevent="listItem" class="space-y-3 mt-3">
        <input
          v-model="form.name"
          class="w-full p-2 border rounded"
          placeholder="Name"
          required
        />
        <input
          v-model="form.description"
          class="w-full p-2 border rounded"
          placeholder="Description"
        />
        <input
          v-model.number="form.priceGrams"
          type="number"
          step="0.1"
          class="w-full p-2 border rounded"
          placeholder="Price (g)"
          required
        />
        <input
          v-model.number="form.stock"
          type="number"
          class="w-full p-2 border rounded"
          placeholder="Stock"
          required
        />
        <button class="w-full py-2 bg-amber-500 text-white rounded">
          List Item
        </button>
      </form>

      <div v-if="toast" class="mt-4 transition-all">
        <div class="p-2 rounded bg-green-100 text-green-800">{{ toast }}</div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useStore } from "../stores/useStore";
import socket from "../socket";
import axios from "axios";

const store = useStore();
const products = ref([]);
const quantities = ref({});
const toast = ref("");

const form = ref({ name: "", description: "", priceGrams: null, stock: 1 });

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

    // show success toast
    toast.value = "Purchase successful";
    setTimeout(() => (toast.value = ""), 3000);
    // add transaction locally
    store.addTransaction({
      id: Date.now(),
      type: "TRADE",
      amount: body.totalPrice || String(product.price),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("buyNow", e);
    toast.value = "Purchase failed";
    setTimeout(() => (toast.value = ""), 3000);
  }
}

async function listItem() {
  try {
    const token = localStorage.getItem("token");
    const priceMg = BigInt(Math.round((form.value.priceGrams || 0) * 1000));
    if (priceMg <= 0n) {
      toast.value = "Price must be > 0";
      setTimeout(() => (toast.value = ""), 3000);
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
    toast.value = "Item listed";
    setTimeout(() => (toast.value = ""), 3000);
    form.value = { name: "", description: "", priceGrams: null, stock: 1 };
    loadProducts();
  } catch (e) {
    console.error("listItem", e);
    toast.value = "Listing failed";
    setTimeout(() => (toast.value = ""), 3000);
  }
}

onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.transition-toast-enter-active {
  transition: opacity 0.25s ease;
}
.transition-toast-leave-active {
  transition: opacity 0.25s ease;
}
</style>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">My Listings</h1>
        <p class="text-sm text-gray-500 mt-1">
          Browse all your active marketplace products.
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
          <h2 class="text-base font-semibold text-gray-900">Active Listings</h2>
          <p class="text-xs text-gray-400">
            Your marketplace products with pagination.
          </p>
        </div>
        <div class="text-xs text-gray-500">
          {{ listingsMeta.rangeStart }}–{{ listingsMeta.rangeEnd }} of
          {{ listingsMeta.total }}
        </div>
      </div>

      <div
        v-if="listings.length === 0"
        class="text-center py-12 text-sm text-gray-400"
      >
        <div class="text-3xl mb-3">🏪</div>
        No listings found.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="product in listings"
          :key="product.id"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
        >
          <div class="min-w-0">
            <div class="text-sm font-semibold text-gray-900">
              {{ product.name }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ formatAmount(product.price) }} · {{ product.stock }} in stock
            </div>
            <p
              v-if="product.description"
              class="text-xs text-gray-400 mt-2 line-clamp-2"
            >
              {{ product.description }}
            </p>
          </div>
          <button
            @click="delistProduct(product.id)"
            class="ml-auto px-3 py-1 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      <Pagination
        v-if="listingsMeta.totalPages > 1"
        :meta="listingsMeta"
        @prev="fetchListings(listingsPage - 1)"
        @next="fetchListings(listingsPage + 1)"
        @goto="fetchListings"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Pagination from "../components/Pagination.vue";

const listings = ref([]);
const listingsPage = ref(1);
const listingsMeta = ref({
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

async function fetchListings(page = 1) {
  if (page < 1) return;
  try {
    const res = await axios.get("/api/market/my-products", {
      headers: authHeader(),
      params: { page, limit: listingsMeta.value.limit },
    });
    listings.value = res.data.items || [];
    if (res.data.meta) {
      listingsMeta.value = res.data.meta;
      listingsPage.value = res.data.meta.page;
    }
  } catch (e) {
    console.warn("Failed to fetch listings", e);
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

async function delistProduct(productId) {
  try {
    await axios.delete(`/api/market/product/${productId}`, {
      headers: authHeader(),
    });
    await fetchListings(listingsPage.value);
  } catch (e) {
    console.warn("Failed to remove listing", e);
  }
}

onMounted(() => fetchListings(listingsPage.value));
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">My Purchases</h1>
        <p class="text-sm text-gray-500 mt-1">
          List of products you purchased.
        </p>
      </div>
      <router-link
        to="/"
        class="text-sm font-semibold text-khilafat-700 hover:underline"
        >Back</router-link
      >
    </div>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div
        v-if="items.length === 0"
        class="text-center py-12 text-sm text-gray-400"
      >
        <div class="text-3xl mb-3">🛍️</div>
        No purchases found.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="it in items"
          :key="it.id"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
        >
          <div class="min-w-0">
            <div class="text-sm font-semibold text-gray-900 truncate">
              {{ it.productName || "Unknown item" }}
            </div>
            <div class="text-xs text-gray-400 mt-1">
              Seller: {{ it.sellerName ? it.sellerName : "#" + it.sellerId }} ·
              {{ formatTime(it.timestamp) }}
            </div>
            <div v-if="it.quantity" class="text-xs text-gray-500 mt-1">
              Quantity: x{{ it.quantity }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-khilafat-700">
              {{ formatAmount(it.amount) }}
            </div>
            <div class="mt-2">
              <button
                v-if="
                  ownedMap()[it.productId] &&
                  ownedMap()[it.productId].quantity > 0
                "
                @click="openResell(it)"
                class="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded"
              >
                Resell
              </button>
            </div>
          </div>
        </div>
      </div>

      <Pagination
        v-if="meta.totalPages > 1"
        :meta="meta"
        @prev="fetch(page - 1)"
        @next="fetch(page + 1)"
        @goto="fetch"
      />
      <!-- Resell modal -->
      <div
        v-if="showResellModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black opacity-30"
          @click="showResellModal = false"
        ></div>
        <div
          class="relative bg-white rounded-lg shadow-lg z-50 w-full max-w-md p-6"
        >
          <h3 class="text-lg font-semibold mb-2">List item for sale</h3>
          <p class="text-sm text-gray-600 mb-4">{{ resellForm.productName }}</p>
          <label class="block text-sm text-gray-700">Price (mg)</label>
          <input
            v-model="resellForm.price"
            class="w-full border rounded px-3 py-2 mt-1"
          />
          <label class="block text-sm text-gray-700 mt-3">Quantity</label>
          <input
            v-model.number="resellForm.quantity"
            type="number"
            min="1"
            class="w-full border rounded px-3 py-2 mt-1"
          />
          <div class="mt-4 flex justify-end space-x-2">
            <button
              @click="showResellModal = false"
              class="px-3 py-1 rounded bg-gray-100"
            >
              Cancel
            </button>
            <button
              @click="submitResell"
              :disabled="resellLoading"
              class="px-3 py-1 rounded bg-yellow-100 text-yellow-800"
            >
              {{ resellLoading ? "Listing..." : "List for sale" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import Pagination from "../components/Pagination.vue";

const items = ref([]);
const page = ref(1);
const meta = ref({
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
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

async function fetch(p = 1) {
  try {
    const res = await axios.get("/api/user/purchases", {
      headers: authHeader(),
      params: { page: p, limit: 10 },
    });
    items.value = res.data.items || [];
    meta.value = res.data.meta || meta.value;
    page.value = meta.value.page;
  } catch (e) {
    console.warn("fetch purchases", e);
  }
}

const owned = ref([]);
async function fetchOwned() {
  try {
    const res = await axios.get("/api/user/owned", { headers: authHeader() });
    owned.value = res.data || [];
  } catch (e) {
    console.warn("fetch owned", e);
  }
}

onMounted(() => fetch());

// fetch owned items too
onMounted(() => fetchOwned());

function ownedMap() {
  const m = {};
  for (const o of owned.value) m[o.productId] = o;
  return m;
}

const showResellModal = ref(false);
const resellLoading = ref(false);
const resellForm = ref({
  ownedItemId: null,
  productName: "",
  price: "",
  quantity: 1,
});

function openResell(it) {
  const map = ownedMap();
  const o = map[it.productId];
  if (!o || (o.quantity || 0) <= 0) {
    showErrorToast("No owned quantity available to resell");
    return;
  }
  resellForm.value.ownedItemId = o.id;
  resellForm.value.productName = it.productName || o.productName || "";
  resellForm.value.price = String(it.amount || "");
  resellForm.value.quantity = 1;
  showResellModal.value = true;
}

async function submitResell() {
  if (!resellForm.value.ownedItemId) return;
  const qty = Number(resellForm.value.quantity) || 1;
  if (qty <= 0) {
    showErrorToast("Quantity must be > 0");
    return;
  }
  resellLoading.value = true;
  try {
    const res = await axios.post(
      "/api/market/resell",
      {
        ownedItemId: resellForm.value.ownedItemId,
        price: String(resellForm.value.price),
        quantity: qty,
        name: resellForm.value.productName,
      },
      { headers: authHeader() },
    );
    if (res && res.data && res.data.id) {
      showResellModal.value = false;
      fetchOwned();
      showSuccessToast("Listed for sale");
    }
  } catch (e) {
    console.warn("resell submit", e);
    showErrorToast("Failed to list for sale");
  } finally {
    resellLoading.value = false;
  }
}
</script>

<style scoped></style>

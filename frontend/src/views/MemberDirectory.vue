<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">Community Members</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ meta.total }} registered members of the Ummah
        </p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="filters.q"
          @input="onSearchInput"
          class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 w-56 bg-white"
          placeholder="Search by username…"
        />
        <select
          v-model="filters.sort"
          @change="fetchPage(1)"
          class="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-khilafat-400 min-w-40"
        >
          <option disabled value="">Sort by…</option>
          <option value="rep">Reputation</option>
          <option value="gold">Gold</option>
          <option value="name">Name</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="n in 8"
        :key="n"
        class="bg-white border border-gray-200 rounded-xl p-5 animate-pulse"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="w-11 h-11 rounded-full bg-gray-200"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3.5 bg-gray-200 rounded w-3/4"></div>
            <div class="h-2.5 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
        <div class="h-1.5 bg-gray-100 rounded-full mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/3 ml-auto"></div>
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="members.length === 0"
      class="text-center py-20 text-gray-400"
    >
      <div class="text-4xl mb-3">🔍</div>
      <p class="font-medium">No members found</p>
      <p class="text-sm mt-1">Try a different search term</p>
    </div>

    <!-- Members grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="u in members"
        :key="u.id"
        class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-khilafat-200 transition-all"
      >
        <!-- Avatar + name + role -->
        <div class="flex items-center gap-3">
          <div
            class="w-11 h-11 rounded-full bg-khilafat-100 flex items-center justify-center text-khilafat-700 font-bold text-lg shrink-0 select-none"
          >
            {{ u.username[0].toUpperCase() }}
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 truncate">
              {{ u.username }}
            </div>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5"
              :class="roleBadge(u.role)"
              >{{ u.role }}</span
            >
          </div>
        </div>

        <!-- Reputation bar -->
        <div>
          <div class="flex justify-between text-xs mb-1.5">
            <span class="text-gray-400 font-medium">Reputation</span>
            <span
              class="font-bold"
              :class="
                u.reputationScore >= 40 ? 'text-khilafat-600' : 'text-red-500'
              "
            >
              {{ u.reputationScore }}
            </span>
          </div>
          <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-1.5 rounded-full transition-all"
              :class="repColor(u.reputationScore)"
              :style="{
                width: Math.min(100, Math.max(0, u.reputationScore)) + '%',
              }"
            ></div>
          </div>
        </div>

        <!-- Gold balance -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium">Gold Balance</span>
          <span class="text-sm font-bold text-amber-600"
            >{{ toGrams(u.goldBalance) }} g</span
          >
        </div>

        <!-- View Profile link -->
        <router-link
          :to="'/profile/' + u.username"
          class="mt-auto block w-full text-center py-1.5 border border-khilafat-200 text-khilafat-700 hover:bg-khilafat-50 rounded-lg text-xs font-semibold transition-colors"
          >View Profile →</router-link
        >
      </div>
    </div>

    <!-- Pagination -->
    <Pagination
      :meta="meta"
      @prev="prevPage"
      @next="nextPage"
      @goto="goToPage"
    />
  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";
import usePagination from "../composables/usePagination";
import Pagination from "../components/Pagination.vue";

const {
  items: members,
  loading,
  filters,
  meta,
  fetchPage,
  onSearchInput: searchInput,
  goToPage,
  nextPage,
  prevPage,
} = usePagination({
  url: "/api/user/directory",
  initialLimit: 20,
  initialSort: "rep",
});

function onSearchInput() {
  searchInput();
}

function toGrams(mg) {
  try {
    return (BigInt(mg || "0") / 1000n).toString();
  } catch {
    return "0";
  }
}

function roleBadge(role) {
  if (role === "KHALIFA") return "bg-amber-100 text-amber-800";
  if (role === "SHURA") return "bg-khilafat-100 text-khilafat-800";
  return "bg-gray-100 text-gray-600";
}

function repColor(score) {
  const s = Number(score || 0);
  if (s < 40) return "bg-red-400";
  if (s < 70) return "bg-amber-400";
  return "bg-khilafat-500";
}

onMounted(() => fetchPage(1));

watch(
  () => filters.sort,
  () => fetchPage(1),
);
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-khilafat-900">Shura Council</h1>
      <p class="text-sm text-gray-500 mt-0.5">Community governance and oversight</p>
    </div>

    <!-- Pending Reports -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-base font-semibold text-gray-900">Pending Reports</h2>
          <p class="text-xs text-gray-400 mt-0.5">Community-flagged conduct issues</p>
        </div>
        <span
          class="px-3 py-1 rounded-full text-xs font-semibold"
          :class="reports.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
        >{{ reports.length }} pending</span>
      </div>

      <div v-if="reports.length === 0" class="text-center py-10 text-sm text-gray-400">
        <div class="text-3xl mb-2">✓</div>
        <p class="font-medium">All clear</p>
        <p>No pending reports</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="r in reports"
          :key="r.id"
          class="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center flex-wrap gap-2 mb-1.5">
                <span class="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full px-2 py-0.5">
                  Reporter #{{ r.reporterId }}
                </span>
                <span class="text-gray-400 text-xs">→</span>
                <span class="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                  Accused #{{ r.accusedId }}
                </span>
                <span class="text-xs text-gray-400 ml-auto">Report #{{ r.id }}</span>
              </div>
              <p class="text-sm text-gray-700">{{ r.reason }}</p>
            </div>
            <div class="flex flex-col gap-2 shrink-0">
              <button
                @click="markValid(r.id, r.accusedId)"
                class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >Mark Valid</button>
              <button
                @click="resolve(r.id)"
                class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- State Decisions -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-1">State Decisions</h2>
      <p class="text-xs text-gray-400 mb-4">Administrative controls for the Shura</p>
      <div class="flex flex-wrap gap-3">
        <button
          @click="toggleMining"
          class="px-4 py-2 bg-khilafat-700 hover:bg-khilafat-600 text-white font-medium rounded-lg text-sm transition-colors"
        >⛏ Toggle Mining Rates</button>
        <button
          @click="approveGrant"
          class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-lg text-sm transition-colors"
        >💰 Approve Public Grant</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const reports = ref([]);

async function loadReports() {
  try {
    const res = await axios.get("/api/hisbah/pending", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    reports.value = res.data;
  } catch (e) {
    console.warn("loadReports", e);
  }
}

async function markValid(id, accusedId) {
  try {
    await axios.post(`/api/hisbah/validate/${id}`, null, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    // notify backend to recalc reputation
    await axios.post(`/api/hisbah/recalc/${accusedId}`, null, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    loadReports();
  } catch (e) {
    console.warn(e);
  }
}

async function resolve(id) {
  try {
    await axios.post(`/api/hisbah/resolve/${id}`, null, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    loadReports();
  } catch (e) {
    console.warn(e);
  }
}

async function toggleMining() {
  try {
    await axios.post("/api/state/toggle-mining", null, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
  } catch (e) {
    console.warn(e);
  }
}

async function approveGrant() {
  try {
    await axios.post("/api/state/approve-grant", null, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
  } catch (e) {
    console.warn(e);
  }
}

onMounted(loadReports);
</script>

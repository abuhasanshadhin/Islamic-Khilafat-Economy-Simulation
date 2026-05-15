<template>
  <div class="bg-white border rounded-md p-4 shadow-sm">
    <h2 class="text-lg font-semibold text-khilafat-700 mb-3">Shura Council</h2>

    <section class="mb-4">
      <h3 class="font-medium">Pending Reports</h3>
      <div v-if="reports.length === 0" class="text-sm text-gray-500">
        No pending reports
      </div>
      <ul class="mt-2 space-y-2">
        <li
          v-for="r in reports"
          :key="r.id"
          class="p-2 border rounded flex items-start justify-between"
        >
          <div>
            <div class="text-sm font-semibold">
              Reporter: {{ r.reporterId }} — Accused: {{ r.accusedId }}
            </div>
            <div class="text-xs text-gray-600">{{ r.reason }}</div>
          </div>
          <div class="flex flex-col gap-2">
            <button
              class="px-2 py-1 bg-green-500 text-white rounded"
              @click="markValid(r.id, r.accusedId)"
            >
              Mark Valid
            </button>
            <button
              class="px-2 py-1 bg-gray-200 rounded"
              @click="resolve(r.id)"
            >
              Resolve
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section>
      <h3 class="font-medium">State Decisions</h3>
      <div class="mt-2 space-x-2">
        <button
          class="px-3 py-1 bg-khilafat-600 text-white rounded"
          @click="toggleMining"
        >
          Toggle Mining Rates
        </button>
        <button
          class="px-3 py-1 bg-amber-500 text-white rounded"
          @click="approveGrant"
        >
          Approve Public Grant
        </button>
      </div>
    </section>
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

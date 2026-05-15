<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-khilafat-900">Shura Council</h1>
      <p class="text-sm text-gray-500 mt-0.5">Community governance and oversight</p>
    </div>

    <!-- File a Report — all authenticated users -->
    <div v-if="isLoggedIn" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-1">File a Hisbah Report</h2>
      <p class="text-xs text-gray-400 mb-4">Report unfair or fraudulent conduct to the Shura Council</p>
      <form @submit.prevent="submitReport" class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-48 relative">
          <label class="text-xs font-medium text-gray-600 block mb-1">Accused Member</label>
          <input
            v-model="reportForm.accusedUsername"
            @input="onAccusedInput"
            @blur="hideAccusedDropdownSoon"
            autocomplete="off"
            required
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
            placeholder="Start typing a username…"
          />
          <!-- Autocomplete dropdown -->
          <div
            v-if="accusedSuggestions.length > 0"
            class="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <button
              v-for="u in accusedSuggestions"
              :key="u.id"
              type="button"
              @mousedown.prevent="selectAccused(u)"
              class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
            >
              <div class="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs shrink-0">
                {{ u.username[0].toUpperCase() }}
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-900">{{ u.username }}</div>
                <div class="text-xs text-gray-400">Rep {{ u.reputationScore }} · {{ u.role }}</div>
              </div>
            </button>
          </div>
        </div>
        <div class="flex-3 min-w-50">
          <label class="text-xs font-medium text-gray-600 block mb-1">Reason</label>
          <input
            v-model="reportForm.reason"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
            placeholder="Describe the fraudulent conduct…"
          />
        </div>
        <button
          type="submit"
          :disabled="reportSubmitting"
          class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors"
        >{{ reportSubmitting ? 'Submitting…' : 'Submit Report' }}</button>
      </form>
      <div v-if="reportMsg" class="mt-3 text-xs px-3 py-2 rounded-lg border" :class="reportMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
        {{ reportMsg.text }}
      </div>
    </div>

    <!-- Pending Reports — SHURA / KHALIFA only -->
    <div v-if="isShuraOrKhalifa" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
                  Reporter: {{ r.reporterUsername }}
                </span>
                <span class="text-gray-400 text-xs">→</span>
                <span class="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                  Accused: {{ r.accusedUsername }}
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

    <!-- State Decisions — SHURA / KHALIFA only -->
    <div v-if="isShuraOrKhalifa" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-1">State Decisions</h2>
      <p class="text-xs text-gray-400 mb-4">Administrative controls for the Shura Council</p>

      <!-- Approve Public Grant -->
      <div class="border border-gray-200 rounded-xl p-4 mb-3 bg-amber-50">
        <p class="text-sm font-semibold text-gray-800 mb-1">💰 Approve Public Grant</p>
        <p class="text-xs text-gray-500 mb-3">Distribute gold from BaitulMal reserves to all registered users.</p>
        <div class="flex flex-wrap gap-3 items-end">
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1">Amount per user (mg)</label>
            <input
              v-model.number="grantAmount"
              type="number"
              min="1"
              class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
              placeholder="1000"
            />
          </div>
          <button
            @click="approveGrant"
            :disabled="grantLoading"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
          >{{ grantLoading ? 'Processing…' : '💰 Approve Grant' }}</button>
        </div>
        <div v-if="grantMsg" class="mt-2 text-xs px-3 py-2 rounded-lg border" :class="grantMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
          {{ grantMsg.text }}
        </div>
      </div>

      <!-- Toggle Mining -->
      <div class="border border-gray-200 rounded-xl p-4 bg-khilafat-50">
        <p class="text-sm font-semibold text-gray-800 mb-1">⛏ Toggle Mining Boost</p>
        <p class="text-xs text-gray-500 mb-3">Enable or disable the enhanced mining rate for the State engine.</p>
        <div class="flex items-center gap-3">
          <button
            @click="toggleMining"
            :disabled="miningLoading"
            class="px-4 py-2 bg-khilafat-700 hover:bg-khilafat-600 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
          >{{ miningLoading ? 'Toggling…' : '⛏ Toggle Mining Rates' }}</button>
          <span v-if="miningBoosted !== null" class="text-xs px-2 py-1 rounded-full font-semibold" :class="miningBoosted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
            {{ miningBoosted ? 'Boosted ON' : 'Boosted OFF' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Not logged in message -->
    <div v-if="!isLoggedIn" class="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
      <div class="text-4xl mb-3">🔒</div>
      <p class="text-sm font-semibold text-gray-700 mb-1">Sign in to participate</p>
      <p class="text-xs text-gray-400 mb-4">Authentication is required to file reports or view council activity</p>
      <router-link to="/login" class="inline-block px-5 py-2 bg-khilafat-700 hover:bg-khilafat-600 text-white font-semibold rounded-lg text-sm transition-colors">Sign In</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "../stores/useStore";
import axios from "axios";

const store = useStore();

const isLoggedIn = computed(() => !!store.user.token);
const isShuraOrKhalifa = computed(() => ['SHURA', 'KHALIFA'].includes(store.user.role));

const reports = ref([]);

// Report form
const reportForm = ref({ accusedUsername: '', reason: '' });
const reportSubmitting = ref(false);
const reportMsg = ref(null);
const accusedSuggestions = ref([]);
let accusedSearchTimer = null;

function onAccusedInput() {
  clearTimeout(accusedSearchTimer);
  const q = reportForm.value.accusedUsername.trim();
  if (q.length < 1) { accusedSuggestions.value = []; return; }
  accusedSearchTimer = setTimeout(async () => {
    try {
      const res = await axios.get(`/api/user/search?q=${encodeURIComponent(q)}`, { headers: authHeader() });
      accusedSuggestions.value = res.data;
    } catch { accusedSuggestions.value = []; }
  }, 250);
}

function selectAccused(u) {
  reportForm.value.accusedUsername = u.username;
  accusedSuggestions.value = [];
}

function hideAccusedDropdownSoon() {
  setTimeout(() => { accusedSuggestions.value = []; }, 150);
}

// Grant
const grantAmount = ref(1000);
const grantLoading = ref(false);
const grantMsg = ref(null);

// Mining
const miningLoading = ref(false);
const miningBoosted = ref(null);

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("token") || ""}` };
}

async function loadReports() {
  if (!isShuraOrKhalifa.value) return;
  try {
    const res = await axios.get("/api/hisbah/pending", { headers: authHeader() });
    reports.value = res.data;
  } catch (e) {
    console.warn("loadReports", e);
  }
}

async function submitReport() {
  reportSubmitting.value = true;
  reportMsg.value = null;
  try {
    await axios.post(
      "/api/hisbah/report",
      { accusedUsername: reportForm.value.accusedUsername, reason: reportForm.value.reason },
      { headers: authHeader() }
    );
    reportMsg.value = { ok: true, text: "Report submitted. The Shura Council will review it." };
    reportForm.value = { accusedUsername: '', reason: '' };
  } catch (e) {
    const msg = e.response?.data?.error || "Failed to submit report.";
    reportMsg.value = { ok: false, text: msg };
  } finally {
    reportSubmitting.value = false;
  }
}

async function markValid(id, accusedId) {
  try {
    await axios.post(`/api/hisbah/validate/${id}`, null, { headers: authHeader() });
    await axios.post(`/api/hisbah/recalc/${accusedId}`, null, { headers: authHeader() });
    loadReports();
  } catch (e) {
    console.warn(e);
  }
}

async function resolve(id) {
  try {
    await axios.post(`/api/hisbah/resolve/${id}`, null, { headers: authHeader() });
    loadReports();
  } catch (e) {
    console.warn(e);
  }
}

async function toggleMining() {
  miningLoading.value = true;
  try {
    const res = await axios.post("/api/state/toggle-mining", null, { headers: authHeader() });
    miningBoosted.value = res.data.miningBoosted;
  } catch (e) {
    console.warn(e);
  } finally {
    miningLoading.value = false;
  }
}

async function approveGrant() {
  grantLoading.value = true;
  grantMsg.value = null;
  try {
    const res = await axios.post(
      "/api/state/approve-grant",
      { amountMg: grantAmount.value },
      { headers: authHeader() }
    );
    grantMsg.value = { ok: true, text: `Grant approved: ${res.data.usersGranted} users received ${grantAmount.value}mg each.` };
  } catch (e) {
    const msg = e.response?.data?.error || "Failed to approve grant.";
    grantMsg.value = { ok: false, text: msg };
  } finally {
    grantLoading.value = false;
  }
}

onMounted(loadReports);
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">
          Shura Council & Muhtasib
        </h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Community governance, market oversight, and Islamic justice
        </p>
      </div>
      <p class="text-sm text-gray-600 max-w-2xl">
        File new Hisbah reports, review pending issues, and manage state
        decisions from one central council page.
      </p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-6">
      <div class="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-2">
          File a Hisbah Report
        </h2>
        <p class="text-xs text-gray-400 mb-5">
          Report unfair or fraudulent conduct to the Shura Council and Muhtasib.
        </p>

        <form @submit.prevent="submitReport" class="grid gap-4">
          <div class="relative">
            <label class="text-xs font-medium text-gray-600 block mb-1"
              >Accused Member</label
            >
            <input
              v-model="reportForm.accusedUsername"
              @input="onAccusedInput"
              @blur="hideAccusedDropdownSoon"
              autocomplete="off"
              required
              class="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
              placeholder="Start typing a username…"
            />
            <div
              v-if="accusedSuggestions.length > 0"
              class="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                v-for="u in accusedSuggestions"
                :key="u.id"
                type="button"
                @mousedown.prevent="selectAccused(u)"
                class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
              >
                <div
                  class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs"
                >
                  {{ u.username[0].toUpperCase() }}
                </div>
                <div>
                  <div class="text-sm font-semibold text-gray-900">
                    {{ u.username }}
                  </div>
                  <div class="text-xs text-gray-400">
                    Rep {{ u.reputationScore }} · {{ u.role }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1"
              >Reason</label
            >
            <input
              v-model="reportForm.reason"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
              placeholder="Describe the fraudulent conduct…"
            />
          </div>

          <div class="flex flex-col gap-3">
            <button
              type="submit"
              :disabled="reportSubmitting"
              class="w-full px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-2xl text-sm transition-colors"
            >
              {{ reportSubmitting ? "Submitting…" : "Submit Report" }}
            </button>
            <span class="text-xs text-gray-500"
              >Every report is logged and reviewed by the Shura Council and
              Muhtasib.</span
            >
          </div>
        </form>

        <div
          v-if="reportMsg"
          class="mt-4 text-xs px-3 py-2 rounded-2xl border"
          :class="
            reportMsg.ok
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          "
        >
          {{ reportMsg.text }}
        </div>
      </div>

      <div
        v-if="isMarketCouncilMember"
        class="bg-white rounded-3xl border border-gray-200 shadow-sm p-6"
      >
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-5"
        >
          <div>
            <h2 class="text-base font-semibold text-gray-900">
              Pending Reports
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">
              Community-flagged conduct issues awaiting review.
            </p>
          </div>
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            :class="
              reports.length > 0
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            "
          >
            {{ reports.length }} pending
          </span>
        </div>

        <div
          v-if="reports.length === 0"
          class="text-center py-14 text-sm text-gray-400"
        >
          <div class="text-4xl mb-2">✓</div>
          <p class="font-semibold">All clear</p>
          <p>No pending reports at this time.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="r in reports"
            :key="r.id"
            class="rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-sm transition-colors hover:bg-gray-100"
          >
            <div
              class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap gap-2 items-center mb-3">
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200"
                    >Reporter: {{ r.reporterUsername }}</span
                  >
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                    >Accused: {{ r.accusedUsername }}</span
                  >
                </div>
                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ r.reason }}
                </p>
                <div class="mt-3 text-xs text-gray-400">
                  Report ID #{{ r.id }}
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="markValid(r.id, r.accusedId)"
                  class="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-2xl transition-colors"
                >
                  Mark Valid
                </button>
                <button
                  type="button"
                  @click="resolve(r.id)"
                  class="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-2xl transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isStateCouncilMember"
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div
        class="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4 gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              💰 Approve Public Grant
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              Distribute gold from BaitulMal reserves to all registered users.
            </p>
          </div>
          <span
            class="text-xs font-semibold text-amber-700 bg-amber-100 rounded-full px-3 py-1"
            >State action</span
          >
        </div>

        <div class="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1"
              >Amount per user (mg)</label
            >
            <input
              v-model.number="grantAmount"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
              placeholder="1000"
            />
          </div>
          <button
            type="button"
            @click="approveGrant"
            :disabled="grantLoading"
            class="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-medium rounded-2xl text-sm transition-colors"
          >
            {{ grantLoading ? "Processing…" : "Approve Grant" }}
          </button>
        </div>

        <div
          v-if="grantMsg"
          class="mt-4 text-xs px-3 py-2 rounded-2xl border"
          :class="
            grantMsg.ok
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          "
        >
          {{ grantMsg.text }}
        </div>
      </div>

      <div
        class="bg-khilafat-50 border border-khilafat-100 rounded-3xl p-6 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4 gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              ⛏ Toggle Mining Boost
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              Enable or disable the enhanced mining rate for the State engine.
            </p>
          </div>
          <span
            class="text-xs font-semibold text-khilafat-700 bg-khilafat-100 rounded-full px-3 py-1"
            >State action</span
          >
        </div>

        <div class="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            @click="toggleMining"
            :disabled="miningLoading"
            class="px-4 py-2 bg-khilafat-700 hover:bg-khilafat-600 disabled:opacity-60 text-white font-medium rounded-2xl text-sm transition-colors"
          >
            {{ miningLoading ? "Toggling…" : "Toggle Mining Rates" }}
          </button>
          <span
            v-if="miningBoosted !== null"
            class="text-xs px-3 py-1 rounded-full font-semibold"
            :class="
              miningBoosted
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            "
          >
            {{ miningBoosted ? "Boosted ON" : "Boosted OFF" }}</span
          >
        </div>
      </div>
    </div>

    <div
      v-if="!isLoggedIn"
      class="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center"
    >
      <div class="text-4xl mb-3">🔒</div>
      <p class="text-sm font-semibold text-gray-700 mb-1">
        Sign in to participate
      </p>
      <p class="text-xs text-gray-400 mb-4">
        Authentication is required to file reports or view council activity
      </p>
      <router-link
        to="/login"
        class="inline-block px-5 py-2 bg-khilafat-700 hover:bg-khilafat-600 text-white font-semibold rounded-2xl text-sm transition-colors"
        >Sign In</router-link
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "../stores/useStore";
import axios from "axios";

const store = useStore();

const isLoggedIn = computed(() => !!store.user.token);
const isMarketCouncilMember = computed(() =>
  ["SHURA", "KHALIFA", "MUHTASIB"].includes(store.user.role),
);
const isStateCouncilMember = computed(() =>
  ["SHURA", "KHALIFA"].includes(store.user.role),
);

const reports = ref([]);

// Report form
const reportForm = ref({ accusedUsername: "", reason: "" });
const reportSubmitting = ref(false);
const reportMsg = ref(null);
const accusedSuggestions = ref([]);
let accusedSearchTimer = null;

function onAccusedInput() {
  clearTimeout(accusedSearchTimer);
  const q = reportForm.value.accusedUsername.trim();
  if (q.length < 1) {
    accusedSuggestions.value = [];
    return;
  }
  accusedSearchTimer = setTimeout(async () => {
    try {
      const res = await axios.get(
        `/api/user/search?q=${encodeURIComponent(q)}`,
        { headers: authHeader() },
      );
      accusedSuggestions.value = res.data;
    } catch {
      accusedSuggestions.value = [];
    }
  }, 250);
}

function selectAccused(u) {
  reportForm.value.accusedUsername = u.username;
  accusedSuggestions.value = [];
}

function hideAccusedDropdownSoon() {
  setTimeout(() => {
    accusedSuggestions.value = [];
  }, 150);
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

function getApiErrorMessage(error, fallback) {
  const raw = error.response?.data?.error;
  if (Array.isArray(raw)) return raw.map((issue) => issue.message).join(". ");
  return raw || fallback;
}

async function loadReports() {
  if (!isMarketCouncilMember.value) return;
  try {
    const res = await axios.get("/api/hisbah/pending", {
      headers: authHeader(),
    });
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
      {
        accusedUsername: reportForm.value.accusedUsername,
        reason: reportForm.value.reason,
      },
      { headers: authHeader() },
    );
    reportMsg.value = {
      ok: true,
      text: "Report submitted. The Shura Council will review it.",
    };
    reportForm.value = { accusedUsername: "", reason: "" };
  } catch (e) {
    const msg = getApiErrorMessage(e, "Failed to submit report.");
    reportMsg.value = { ok: false, text: msg };
  } finally {
    reportSubmitting.value = false;
  }
}

async function markValid(id, accusedId) {
  try {
    await axios.post(`/api/hisbah/validate/${id}`, null, {
      headers: authHeader(),
    });
    await axios.post(`/api/hisbah/recalc/${accusedId}`, null, {
      headers: authHeader(),
    });
    loadReports();
  } catch (e) {
    console.warn(e);
  }
}

async function resolve(id) {
  try {
    await axios.post(`/api/hisbah/resolve/${id}`, null, {
      headers: authHeader(),
    });
    loadReports();
  } catch (e) {
    console.warn(e);
  }
}

async function toggleMining() {
  miningLoading.value = true;
  try {
    const res = await axios.post("/api/state/toggle-mining", null, {
      headers: authHeader(),
    });
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
      { headers: authHeader() },
    );
    grantMsg.value = {
      ok: true,
      text: `Grant approved: ${res.data.usersGranted} users received ${grantAmount.value}mg each.`,
    };
  } catch (e) {
    const msg = getApiErrorMessage(e, "Failed to approve grant.");
    grantMsg.value = { ok: false, text: msg };
  } finally {
    grantLoading.value = false;
  }
}

onMounted(loadReports);
</script>

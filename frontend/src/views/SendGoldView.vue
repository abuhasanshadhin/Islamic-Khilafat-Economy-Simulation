<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">Send Gold</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Transfer gold directly to any member of the Ummah.
        </p>
      </div>
      <router-link
        to="/"
        class="text-sm text-khilafat-600 hover:text-khilafat-800"
      >
        ← Back to Dashboard
      </router-link>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-2">
        Transfer Details
      </h2>
      <p class="text-xs text-gray-400 mb-4">
        Enter a username and amount to send gold to another member.
      </p>

      <form @submit.prevent="sendGold" class="grid gap-4">
        <div class="grid gap-2">
          <label class="text-xs font-medium text-gray-600"
            >Recipient username</label
          >
          <div class="relative">
            <input
              v-model="transfer.username"
              @input="onUsernameInput"
              @blur="hideDropdownSoon"
              autocomplete="off"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
              placeholder="Start typing a username…"
              required
            />
            <div
              v-if="userSuggestions.length > 0"
              class="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="u in userSuggestions"
                :key="u.id"
                type="button"
                @mousedown.prevent="selectUser(u)"
                class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-khilafat-50 transition-colors text-left"
              >
                <div
                  class="w-7 h-7 rounded-full bg-khilafat-100 flex items-center justify-center text-khilafat-700 font-bold text-xs shrink-0"
                >
                  {{ u.username[0].toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
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
        </div>

        <div class="grid gap-2">
          <label class="text-xs font-medium text-gray-600">Amount (g)</label>
          <input
            v-model.number="transfer.amountGrams"
            type="number"
            step="0.001"
            min="0.001"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 focus:border-transparent"
            placeholder="0.000"
            required
          />
        </div>

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="text-sm text-gray-500">
            Your balance:
            <span class="font-semibold text-khilafat-800"
              >{{ goldGrams }} g</span
            >
          </div>
          <button
            type="submit"
            :disabled="transferLoading"
            class="inline-flex items-center justify-center px-5 py-2 bg-khilafat-700 hover:bg-khilafat-600 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {{ transferLoading ? "Sending…" : "↗ Send Gold" }}
          </button>
        </div>
      </form>

      <div
        v-if="transferMsg"
        class="mt-4 text-xs px-3 py-2 rounded-lg border"
        :class="
          transferMsg.ok
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        "
      >
        {{ transferMsg.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { useStore } from "../stores/useStore";

const store = useStore();
const route = useRoute();
const user = computed(() => store.user);

const transfer = ref({ username: "", amountGrams: null });
const transferLoading = ref(false);
const transferMsg = ref(null);
const userSuggestions = ref([]);
let searchTimer = null;

function onUsernameInput() {
  clearTimeout(searchTimer);
  const q = transfer.value.username.trim();
  if (q.length < 1) {
    userSuggestions.value = [];
    return;
  }

  searchTimer = setTimeout(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/user/search?q=${encodeURIComponent(q)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      userSuggestions.value = res.data;
    } catch {
      userSuggestions.value = [];
    }
  }, 250);
}

function selectUser(u) {
  transfer.value.username = u.username;
  userSuggestions.value = [];
}

function hideDropdownSoon() {
  setTimeout(() => {
    userSuggestions.value = [];
  }, 150);
}

onMounted(() => {
  if (route.query.sendTo) {
    transfer.value.username = String(route.query.sendTo);
  }
});

function formatMgToGramString(mgString) {
  try {
    const mg = BigInt(mgString || "0");
    const grams = mg / 1000n;
    const rem = mg % 1000n;
    if (rem === 0n) return grams.toString();
    const remStr = rem.toString().padStart(3, "0").replace(/0+$/, "");
    return `${grams}.${remStr}`;
  } catch {
    return String(mgString);
  }
}

const goldGrams = computed(() => formatMgToGramString(user.value.goldBalance));

async function sendGold() {
  transferLoading.value = true;
  transferMsg.value = null;

  try {
    const token = localStorage.getItem("token");
    await axios.post(
      "/api/user/transfer",
      {
        receiverUsername: transfer.value.username,
        amountGrams: transfer.value.amountGrams,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    transferMsg.value = {
      ok: true,
      text: `Sent ${transfer.value.amountGrams} g to ${transfer.value.username}`,
    };
    transfer.value = { username: "", amountGrams: null };
  } catch (e) {
    transferMsg.value = {
      ok: false,
      text: e.response?.data?.error || "Transfer failed",
    };
  }

  transferLoading.value = false;
  setTimeout(() => {
    transferMsg.value = null;
  }, 4000);
}
</script>

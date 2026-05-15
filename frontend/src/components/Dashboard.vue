<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-0.5">Your personal treasury overview</p>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Gold Balance -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Gold Balance</span>
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">g</div>
        </div>
        <div class="text-3xl font-bold text-gray-900">{{ goldGrams }}<span class="text-base font-medium text-gray-400 ml-1">g</span></div>
        <div class="text-xs text-gray-400 mt-1">{{ formattedMg }} mg</div>
      </div>

      <!-- Reputation -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reputation</span>
          <div class="w-8 h-8 rounded-lg bg-khilafat-100 flex items-center justify-center text-khilafat-600 font-bold text-sm">★</div>
        </div>
        <div class="text-3xl font-bold text-gray-900">{{ user.reputationScore }}</div>
        <div class="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-1.5 rounded-full bg-khilafat-500 transition-all" :style="{ width: Math.min(100, user.reputationScore) + '%' }"></div>
        </div>
      </div>

      <!-- Role -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</span>
          <div class="w-8 h-8 rounded-lg bg-khilafat-100 flex items-center justify-center text-khilafat-600 text-sm">👤</div>
        </div>
        <div class="text-xl font-bold text-khilafat-700">{{ user.role }}</div>
        <div class="text-xs text-gray-400 mt-1">Community rank</div>
      </div>

      <!-- Zakat -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Zakat</span>
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm">◈</div>
        </div>
        <div class="text-xl font-bold" :class="user.isZakatEligible ? 'text-green-600' : 'text-gray-400'">
          {{ user.isZakatEligible ? 'Eligible' : 'N/A' }}
        </div>
        <div class="text-xs text-gray-400 mt-1">Annual obligation</div>
      </div>
    </div>

    <!-- Reserves + Transactions row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- BaitulMal Reserves -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-semibold text-gray-900">BaitulMal Reserves</h2>
            <p class="text-xs text-gray-400 mt-0.5">State treasury — real-time</p>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <span class="live-dot"></span>Live
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Gold</div>
            <div class="text-2xl font-bold text-amber-700">{{ baitulGoldGrams }}</div>
            <div class="text-xs text-amber-500 font-medium">g</div>
            <div class="text-xs text-gray-400 mt-1">{{ baitulGoldMg }} mg</div>
          </div>
          <div class="bg-khilafat-50 border border-khilafat-100 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-khilafat-600 uppercase tracking-wide mb-2">Oil</div>
            <div class="text-2xl font-bold text-khilafat-700">{{ baitulOil }}</div>
            <div class="text-xs text-khilafat-500 font-medium">L</div>
          </div>
          <div class="bg-khilafat-50 border border-khilafat-100 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-khilafat-600 uppercase tracking-wide mb-2">Gas</div>
            <div class="text-2xl font-bold text-khilafat-700">{{ baitulGas }}</div>
            <div class="text-xs text-khilafat-500 font-medium">m³</div>
          </div>
        </div>

        <!-- Resource Prices -->
        <div class="border-t border-gray-100 pt-4 mb-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Market Prices</p>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="r in ['GOLD','OIL','GAS']" :key="r" class="flex flex-col items-center bg-gray-50 rounded-lg px-3 py-2 text-center">
              <span class="text-xs text-gray-400 font-semibold">{{ r }}</span>
              <span class="text-sm font-bold text-amber-600 mt-1">{{ resourcePrice(r) }}</span>
              <span class="text-xs text-gray-400">mg/unit</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center justify-between">
          <span class="text-sm text-gray-500">Total Zakat Collected</span>
          <span class="text-sm font-semibold text-khilafat-700">{{ formatMgToGramString(store.baitulMal.totalZakatCollected ?? '0') }} g</span>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div class="flex-1 space-y-2 overflow-auto max-h-64">
          <div v-if="transactions.length === 0" class="text-center py-10 text-sm text-gray-400">
            <div class="text-2xl mb-2">📋</div>
            No transactions yet
          </div>
          <div
            v-for="tx in transactions"
            :key="tx.id"
            class="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                :class="txClass(tx.type)"
              >{{ txIcon(tx.type) }}</div>
              <div>
                <div class="text-xs font-semibold text-gray-800">{{ tx.type }}</div>
                <div class="text-xs text-gray-400">{{ formatTime(tx.timestamp) }}</div>
              </div>
            </div>
            <div class="text-xs font-semibold text-khilafat-700 ml-2">{{ formatAmount(tx.amount) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import axios from 'axios'
import { useStore } from '../stores/useStore'

const store = useStore()
const user = computed(() => store.user)
const transactions = computed(() => store.transactions)

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const [meRes, txRes, pricesRes] = await Promise.all([
      axios.get('/api/user/me', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/user/transactions', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/market/prices'),
    ])
    store.setUser({ ...meRes.data, token })
    txRes.data.forEach(tx => store.addTransaction(tx))
    store.setPrices(pricesRes.data)
  } catch (e) {
    console.warn('Dashboard fetch', e)
  }
})

function resourcePrice(resource) {
  const p = store.prices[resource]
  if (!p) return '—'
  return Number(p.priceInGoldMg).toLocaleString()
}

function formatMgToGramString(mgString) {
  try {
    const mg = BigInt(mgString || '0')
    const grams = mg / 1000n
    const rem = mg % 1000n
    if (rem === 0n) return grams.toString()
    const remStr = rem.toString().padStart(3, '0').replace(/0+$/, '')
    return `${grams}.${remStr}`
  } catch { return String(mgString) }
}

const goldGrams = computed(() => formatMgToGramString(user.value.goldBalance))
const formattedMg = computed(() => user.value.goldBalance)
const baitulGoldMg = computed(() => store.baitulMal.goldReserve)
const baitulGoldGrams = computed(() => formatMgToGramString(baitulGoldMg.value))
const baitulOil = computed(() => Number(store.baitulMal.oilReserve).toFixed(2))
const baitulGas = computed(() => Number(store.baitulMal.gasReserve).toFixed(2))

function formatAmount(amount) {
  try { return formatMgToGramString(amount) + ' g' } catch { return String(amount) }
}

function formatTime(ts) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return ts }
}

const txTypeMap = {
  TRADE:    { bg: 'bg-amber-100 text-amber-700',    icon: '⇄' },
  TRANSFER: { bg: 'bg-blue-100 text-blue-700',      icon: '→' },
  GRANT:    { bg: 'bg-khilafat-100 text-khilafat-700', icon: '↓' },
  ZAKAT:    { bg: 'bg-purple-100 text-purple-700',  icon: '◈' },
}
function txClass(type) { return (txTypeMap[type] || txTypeMap.TRANSFER).bg }
function txIcon(type)  { return (txTypeMap[type] || txTypeMap.TRANSFER).icon }
</script>

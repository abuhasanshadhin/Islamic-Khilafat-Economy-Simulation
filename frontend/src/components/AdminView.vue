<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-khilafat-900">Admin — Khalifa Panel</h1>
      <p class="text-sm text-gray-500 mt-0.5">Global monitoring and analytics</p>
    </div>

    <!-- Transaction Monitor -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-4">Real-time Transactions</h2>
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <select v-model="filterType" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khilafat-400 bg-white">
          <option value="ALL">All Types</option>
          <option value="ZAKAT">Zakat</option>
          <option value="TRADE">Trade</option>
          <option value="GRANT">Grant</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <input
          type="number"
          v-model.number="minAmount"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-khilafat-400"
          placeholder="Min amount (mg)"
        />
        <span class="ml-auto text-xs text-gray-400">{{ filtered.length }} records</span>
      </div>

      <div class="overflow-auto max-h-72 rounded-lg border border-gray-100">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount (g)</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sender</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receiver</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-400">No transactions</td>
            </tr>
            <tr
              v-for="tx in filtered"
              :key="tx.id"
              class="border-t border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" :class="txBadge(tx.type)">{{ tx.type }}</span>
              </td>
              <td class="px-4 py-3 font-medium text-amber-700">{{ toGrams(tx.amount) }} g</td>
              <td class="px-4 py-3 text-gray-600">{{ tx.senderId || '—' }}</td>
              <td class="px-4 py-3 text-gray-600">{{ tx.receiverId || '—' }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ tx.timestamp }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">BaitulMal Gold Reserve Over Time</h3>
        <canvas ref="lineChart" height="140"></canvas>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Wealth Distribution</h3>
        <canvas ref="pieChart" height="140"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from '../stores/useStore'
import Chart from 'chart.js/auto'

const store = useStore()
const filterType = ref('ALL')
const minAmount = ref(0)

const transactions = computed(() => store.transactions)

const filtered = computed(() => {
  return transactions.value.filter(tx => {
    if (filterType.value !== 'ALL' && tx.type !== filterType.value) return false
    try {
      const amt = BigInt(tx.amount || '0')
      if (amt < BigInt(minAmount.value || 0)) return false
    } catch (e) {}
    return true
  })
})

function toGrams(amount) {
  try {
    const mg = BigInt(amount)
    return (mg / 1000n).toString()
  } catch (e) { return amount }
}

const txBadgeMap = {
  TRADE:    'bg-amber-100 text-amber-700',
  TRANSFER: 'bg-blue-100 text-blue-700',
  GRANT:    'bg-khilafat-100 text-khilafat-700',
  ZAKAT:    'bg-purple-100 text-purple-700',
}
function txBadge(type) { return txBadgeMap[type] || 'bg-gray-100 text-gray-600' }

const lineChart = ref(null)
const pieChart = ref(null)

onMounted(() => {
  // Line chart of baitul gold over time - sample from store.history if present
  const labels = (store.baitulHistory || []).map(h => new Date(h.timestamp).toLocaleString())
  const data = (store.baitulHistory || []).map(h => Number(h.goldReserve || 0))

  if (lineChart.value) {
    new Chart(lineChart.value.getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gold (mg)', data, borderColor: '#f6a400', backgroundColor: 'rgba(246,164,0,0.2)' }] },
      options: { responsive: true }
    })
  }

  // Pie chart: users vs baitul
  const totalUsers = Number(store.totalUserGold || 0)
  const baitul = Number(store.baitulMal.goldReserve || 0)
  if (pieChart.value) {
    new Chart(pieChart.value.getContext('2d'), {
      type: 'pie',
      data: { labels: ['Users', 'BaitulMal'], datasets: [{ data: [totalUsers, baitul], backgroundColor: ['#257a36', '#f6a400'] }] },
      options: { responsive: true }
    })
  }
})
</script>

<style scoped>
.table-fixed { table-layout: fixed }
</style>

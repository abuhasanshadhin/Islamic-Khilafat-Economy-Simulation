<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold text-khilafat-700">Khalifa - Global Monitoring</h2>

    <section class="bg-white border rounded p-4 shadow-sm">
      <h3 class="font-medium mb-2">Real-time Transactions</h3>
      <div class="flex items-center gap-3 mb-3">
        <select v-model="filterType" class="p-2 border rounded">
          <option value="ALL">All</option>
          <option value="ZAKAT">Zakat</option>
          <option value="TRADE">Trade</option>
          <option value="GRANT">Grant</option>
        </select>
        <input type="number" v-model.number="minAmount" class="p-2 border rounded" placeholder="Min amount (mg)" />
      </div>

      <div class="overflow-auto max-h-72">
        <table class="w-full text-left table-auto">
          <thead>
            <tr class="text-sm text-gray-600">
              <th class="px-2 py-1">Type</th>
              <th class="px-2 py-1">Amount (g)</th>
              <th class="px-2 py-1">Sender</th>
              <th class="px-2 py-1">Receiver</th>
              <th class="px-2 py-1">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in filtered" :key="tx.id" class="border-t">
              <td class="px-2 py-1">{{ tx.type }}</td>
              <td class="px-2 py-1">{{ toGrams(tx.amount) }}</td>
              <td class="px-2 py-1">{{ tx.senderId || '-' }}</td>
              <td class="px-2 py-1">{{ tx.receiverId || '-' }}</td>
              <td class="px-2 py-1">{{ tx.timestamp }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white border rounded p-4 shadow-sm">
        <h3 class="font-medium mb-2">BaitulMal Gold Reserve Over Time</h3>
        <canvas ref="lineChart" height="140"></canvas>
      </div>

      <div class="bg-white border rounded p-4 shadow-sm">
        <h3 class="font-medium mb-2">Wealth Distribution</h3>
        <canvas ref="pieChart" height="140"></canvas>
      </div>
    </section>
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

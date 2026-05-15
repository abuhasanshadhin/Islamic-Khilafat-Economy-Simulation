<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-khilafat-900">Admin — Khalifa Panel</h1>
        <p class="text-sm text-gray-500 mt-0.5">Global monitoring and analytics</p>
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="flex bg-gray-100 rounded-xl p-1 w-fit gap-1">
      <button v-for="t in tabs" :key="t" @click="activeTab = t"
        :class="activeTab === t ? 'bg-white shadow-sm text-khilafat-800 font-semibold' : 'text-gray-500 hover:text-gray-700'"
        class="px-4 py-2 text-sm rounded-lg transition-all"
      >{{ t }}</button>
    </div>

    <!-- Transactions Tab -->
    <div v-if="activeTab === 'Transactions'" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
        <span class="ml-auto text-xs text-gray-400">{{ txTotal }} records</span>
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
            <tr v-if="txItems.length === 0 && !txLoading">
              <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-400">No transactions</td>
            </tr>
            <tr v-for="tx in txItems" :key="tx.id" class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" :class="txBadge(tx.type)">{{ tx.type }}</span>
              </td>
              <td class="px-4 py-3 font-medium text-amber-700">{{ toGrams(tx.amount) }} g</td>
              <td class="px-4 py-3 text-gray-600">{{ tx.senderId || '—' }}</td>
              <td class="px-4 py-3 text-gray-600">{{ tx.receiverId || '—' }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ formatTime(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
        <PaginationControls
          :page="txPage"
          :total="txTotal"
          :limit="txLimit"
          :pageInput="txPageInput"
          :rangeStart="() => ((txPage-1)*txLimit)+1"
          :rangeEnd="() => Math.min(txTotal, txPage*txLimit)"
          :totalPages="() => Math.max(1, Math.ceil(txTotal/txLimit))"
          @prev="() => fetchTransactions(txPage-1)"
          @next="() => fetchTransactions(txPage+1)"
          @goto="p => fetchTransactions(p)"
          @update:pageInput="val => txPageInput = val"
        />
    </div>

    <!-- Charts Tab -->
    <div v-if="activeTab === 'Charts'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">BaitulMal Gold Reserve Over Time</h3>
        <canvas ref="lineChart" height="140"></canvas>
        <p v-if="store.baitulHistory.length === 0" class="text-xs text-gray-400 text-center mt-2">Accumulates as mining events arrive via socket</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Wealth Distribution</h3>
        <canvas ref="pieChart" height="140"></canvas>
        <p v-if="allUsers.length === 0" class="text-xs text-gray-400 text-center mt-2">Loading user data…</p>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'Users'" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-900">User Management</h2>
        <span class="text-xs text-gray-400">{{ allUsers.length }} users</span>
      </div>
      <div class="overflow-auto max-h-96 rounded-lg border border-gray-100">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Username</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rep</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assign Role</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="allUsers.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">Loading users…</td>
            </tr>
            <tr v-for="u in allUsers" :key="u.id" class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-500">#{{ u.id }}</td>
              <td class="px-4 py-3 font-medium text-gray-900">{{ u.username }}</td>
              <td class="px-4 py-3 text-amber-700 font-semibold">{{ toGrams(u.goldBalance) }} g</td>
              <td class="px-4 py-3">
                <span class="font-semibold" :class="u.reputationScore >= 40 ? 'text-khilafat-600' : 'text-red-500'">{{ u.reputationScore }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="roleBadge(u.role)">{{ u.role }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <select v-model="roleSelections[u.id]" class="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-khilafat-400">
                    <option value="USER">USER</option>
                    <option value="SHURA">SHURA</option>
                    <option value="KHALIFA">KHALIFA</option>
                  </select>
                  <button
                    @click="assignRole(u)"
                    class="px-2 py-1 bg-khilafat-700 hover:bg-khilafat-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >Save</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="roleMsg" class="mt-3 text-xs px-3 py-2 rounded-lg border" :class="roleMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
        {{ roleMsg.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from '../stores/useStore'
import axios from 'axios'
import Chart from 'chart.js/auto'
import PaginationControls from './PaginationControls.vue'

const store = useStore()
const tabs = ['Transactions', 'Charts', 'Users']
const activeTab = ref('Transactions')

const filterType = ref('ALL')
const minAmount = ref(0)
const allTransactions = ref([])
const txItems = ref([])
const txTotal = ref(0)
const txPage = ref(1)
const txLimit = ref(50)
const txPageInput = ref(1)
const txLoading = ref(false)
const allUsers = ref([])
const roleSelections = ref({})
const roleMsg = ref(null)

const transactions = computed(() => allTransactions.value.length ? allTransactions.value : store.transactions)

// Server-driven transactions (paginated)
async function fetchTransactions(p = txPage.value) {
  txLoading.value = true
  try {
    const params = { page: p, limit: txLimit.value }
    if (filterType.value && filterType.value !== 'ALL') params.type = filterType.value
    if (minAmount.value) params.minAmount = String(minAmount.value)
    const res = await axios.get('/api/state/transactions', { headers: authHeader(), params })
    txItems.value = res.data.items || []
    txTotal.value = res.data.total || 0
    txPage.value = res.data.page || p
    txPageInput.value = txPage.value
  } catch (e) {
    console.warn('AdminView: fetch transactions failed', e)
  } finally { txLoading.value = false }
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
}

function toGrams(amount) {
  try { return (BigInt(amount) / 1000n).toString() } catch { return String(amount) }
}

function formatTime(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) } catch { return ts }
}

const txBadgeMap = {
  TRADE: 'bg-amber-100 text-amber-700',
  TRANSFER: 'bg-blue-100 text-blue-700',
  GRANT: 'bg-khilafat-100 text-khilafat-700',
  ZAKAT: 'bg-purple-100 text-purple-700',
}
function txBadge(type) { return txBadgeMap[type] || 'bg-gray-100 text-gray-600' }

function roleBadge(role) {
  if (role === 'KHALIFA') return 'bg-amber-100 text-amber-800'
  if (role === 'SHURA') return 'bg-khilafat-100 text-khilafat-800'
  return 'bg-gray-100 text-gray-600'
}

async function assignRole(user) {
  roleMsg.value = null
  const newRole = roleSelections.value[user.id] ?? user.role
  try {
    await axios.post('/api/user/assign-role', { userId: user.id, role: newRole }, { headers: authHeader() })
    user.role = newRole
    roleMsg.value = { ok: true, text: `${user.username} is now ${newRole}` }
  } catch (e) {
    roleMsg.value = { ok: false, text: e.response?.data?.error || 'Failed to assign role' }
  }
  setTimeout(() => (roleMsg.value = null), 3000)
}

const lineChart = ref(null)
const pieChart = ref(null)
let lineChartInstance = null
let pieChartInstance = null

function buildCharts() {
  const labels = store.baitulHistory.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  const lineData = store.baitulHistory.map(h => Number(h.goldReserve || 0))

  if (lineChart.value) {
    if (lineChartInstance) lineChartInstance.destroy()
    lineChartInstance = new Chart(lineChart.value.getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gold reserve (mg)', data: lineData, borderColor: '#f6a400', backgroundColor: 'rgba(246,164,0,0.15)', tension: 0.4, fill: true }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    })
  }

  const totalUserGold = allUsers.value.reduce((sum, u) => {
    try { return sum + Number(BigInt(u.goldBalance || '0')) } catch { return sum }
  }, 0)
  const baitul = Number(BigInt(store.baitulMal.goldReserve || '0'))
  if (pieChart.value) {
    if (pieChartInstance) pieChartInstance.destroy()
    pieChartInstance = new Chart(pieChart.value.getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['All Users', 'BaitulMal'],
        datasets: [{ data: [totalUserGold, baitul], backgroundColor: ['#257a36', '#f6a400'] }]
      },
      options: { responsive: true }
    })
  }
}

// Rebuild charts whenever tab changes to Charts
watch(activeTab, (tab) => {
  if (tab === 'Charts') {
    setTimeout(buildCharts, 50)
  }
})

// Also rebuild when new baitulHistory data arrives
watch(() => store.baitulHistory.length, () => {
  if (activeTab.value === 'Charts' && lineChart.value) buildCharts()
})

onMounted(async () => {
  try {
    const usersRes = await axios.get('/api/user/all', { headers: authHeader() })
    allUsers.value = usersRes.data
    allUsers.value.forEach(u => { roleSelections.value[u.id] = u.role })
    // initial transactions fetch
    fetchTransactions(1)
  } catch (e) {
    console.warn('AdminView: fetch failed', e)
  }
})
</script>

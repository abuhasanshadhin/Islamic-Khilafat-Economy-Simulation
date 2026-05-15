import { ref } from 'vue'
import axios from 'axios'

// Simple reusable pagination composable for server-driven lists.
// Options: { url, initialQuery, initialSort, initialLimit }
export default function usePagination(options = {}) {
  const url = options.url || '/api/user/directory'
  const search = ref(options.initialQuery || '')
  const sort = ref(options.initialSort || 'rep')
  const page = ref(1)
  const limit = ref(options.initialLimit || 20)
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const pageInput = ref(1)

  async function fetchPage(p = page.value) {
    loading.value = true
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: search.value.trim(), page: p, limit: limit.value, sort: sort.value }
      })
      items.value = res.data.items || []
      total.value = res.data.total || 0
      page.value = res.data.page || p
      pageInput.value = page.value
    } catch (err) {
      console.warn('pagination fetch', err)
    } finally {
      loading.value = false
    }
  }

  // simple debounced search trigger
  let timer = null
  function onSearchInput(delay = 300) {
    clearTimeout(timer)
    timer = setTimeout(() => fetchPage(1), delay)
  }

  function goToPage() {
    const p = Number(pageInput.value) || 1
    const last = Math.max(1, Math.ceil((total.value || 0) / limit.value))
    fetchPage(Math.max(1, Math.min(p, last)))
  }

  function nextPage() { if (page.value < Math.ceil(total.value / limit.value)) fetchPage(page.value + 1) }
  function prevPage() { if (page.value > 1) fetchPage(page.value - 1) }

  const totalPages = () => Math.max(1, Math.ceil((total.value || 0) / limit.value))
  const rangeStart = () => ((page.value - 1) * limit.value) + 1
  const rangeEnd = () => Math.min(total.value, page.value * limit.value)

  return {
    items,
    search,
    sort,
    page,
    limit,
    total,
    loading,
    pageInput,
    fetchPage,
    onSearchInput,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    rangeStart,
    rangeEnd,
  }
}

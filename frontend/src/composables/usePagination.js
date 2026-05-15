import { reactive, toRefs } from 'vue'
import axios from 'axios'

// Structured reusable pagination composable for server-driven lists.
// Options: { url, initialQuery, initialSort, initialPage, initialLimit, initialParams }
export default function usePagination(options = {}) {
  const url = options.url || '/api/user/directory'
  const initialQuery = options.initialQuery || ''
  const initialSort = options.initialSort || ''
  const initialPage = Number(options.initialPage || 1)
  const initialLimit = Number(options.initialLimit || 20)
  const initialParams = { ...(options.initialParams || {}) }

  const pagination = reactive({
    items: [],
    loading: false,
    filters: {
      q: initialQuery,
      sort: initialSort,
      page: initialPage,
      limit: initialLimit,
      extra: initialParams,
    },
    meta: {
      total: 0,
      page: initialPage,
      limit: initialLimit,
      totalPages: 1,
      rangeStart: 1,
      rangeEnd: 0,
      hasNext: false,
      hasPrevious: false,
    },
  })

  function updateMeta({ total: newTotal, page: newPage, limit: newLimit }) {
    const normalizedLimit = Math.max(1, Number(newLimit || pagination.filters.limit || 1))
    const normalizedPage = Math.max(1, Number(newPage || pagination.filters.page || 1))
    const normalizedTotal = Math.max(0, Number(newTotal || 0))
    const totalPages = Math.max(1, Math.ceil(normalizedTotal / normalizedLimit))

    pagination.meta = {
      total: normalizedTotal,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages,
      rangeStart: normalizedTotal === 0 ? 0 : (normalizedPage - 1) * normalizedLimit + 1,
      rangeEnd: Math.min(normalizedTotal, normalizedPage * normalizedLimit),
      hasNext: normalizedPage < totalPages,
      hasPrevious: normalizedPage > 1,
    }
  }

  async function fetchPage(requestedPage = pagination.filters.page, requestParams = {}) {
    pagination.loading = true
    try {
      const token = localStorage.getItem('token')
      const params = {
        ...pagination.filters.extra,
        q: String(pagination.filters.q || '').trim(),
        page: requestedPage,
        limit: pagination.filters.limit,
        sort: pagination.filters.sort,
        ...requestParams,
      }

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      })

      const payload = res.data || {}
      const pageData = payload.data || payload.items || []
      const serverMeta = payload.meta || {
        total: payload.total || 0,
        page: payload.page || requestedPage,
        limit: payload.limit || pagination.filters.limit,
      }

      pagination.items = Array.isArray(pageData) ? pageData : []
      pagination.filters.page = Math.max(1, Number(serverMeta.page || requestedPage))
      pagination.filters.limit = Math.max(1, Number(serverMeta.limit || pagination.filters.limit))
      updateMeta({ total: serverMeta.total, page: pagination.filters.page, limit: pagination.filters.limit })
    } catch (err) {
      console.warn('pagination fetch', err)
    } finally {
      pagination.loading = false
    }
  }

  let timer = null
  function onSearchInput(delay = 300) {
    clearTimeout(timer)
    timer = setTimeout(() => fetchPage(1), delay)
  }

  function goToPage(destinationPage) {
    const requestedPage = Number(destinationPage || pagination.filters.page) || 1
    const boundedPage = Math.max(1, Math.min(requestedPage, pagination.meta.totalPages))
    fetchPage(boundedPage)
  }

  function nextPage() {
    if (pagination.meta.hasNext) fetchPage(pagination.meta.page + 1)
  }

  function prevPage() {
    if (pagination.meta.hasPrevious) fetchPage(pagination.meta.page - 1)
  }

  function setLimit(newLimit) {
    pagination.filters.limit = Math.max(1, Number(newLimit) || initialLimit)
    fetchPage(1)
  }

  function setFilterParams(params = {}) {
    pagination.filters.extra = { ...pagination.filters.extra, ...params }
  }

  function resetPagination() {
    pagination.filters.page = initialPage
    pagination.filters.limit = initialLimit
    pagination.meta = {
      total: 0,
      page: initialPage,
      limit: initialLimit,
      totalPages: 1,
      rangeStart: 1,
      rangeEnd: 0,
      hasNext: false,
      hasPrevious: false,
    }
  }

  return {
    ...toRefs(pagination),
    pagination,
    fetchPage,
    onSearchInput,
    goToPage,
    nextPage,
    prevPage,
    setLimit,
    setFilterParams,
    resetPagination,
  }
}

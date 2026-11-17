import { onMounted, reactive, ref } from 'vue'

/**
 * Server-driven list: page / page_size / search / filters → API params.
 * Expects DRF-style `{ count, results }` responses.
 */
export function useServerList(fetcher, { pageSize = 20, immediate = true, debounceMs = 300 } = {}) {
  const rows = ref([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const pageSizeRef = ref(pageSize)
  const search = ref('')
  const filters = reactive({})

  let debounceTimer = null
  let requestId = 0

  function buildParams() {
    const params = {
      page: page.value,
      page_size: pageSizeRef.value,
    }
    const q = search.value?.trim()
    if (q) params.search = q
    for (const [key, value] of Object.entries(filters)) {
      if (value === '' || value === null || value === undefined) continue
      params[key] = value
    }
    return params
  }

  async function load() {
    const id = ++requestId
    loading.value = true
    try {
      const data = await fetcher(buildParams())
      if (id !== requestId) return
      if (Array.isArray(data)) {
        rows.value = data
        total.value = data.length
      } else {
        rows.value = data?.results || []
        total.value = data?.count ?? rows.value.length
      }
    } catch {
      if (id !== requestId) return
      rows.value = []
      total.value = 0
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  function onSearchInput() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      page.value = 1
      load()
    }, debounceMs)
  }

  function onFilterChange() {
    page.value = 1
    load()
  }

  function onPageChange(p) {
    page.value = p
    load()
  }

  function onSizeChange(size) {
    pageSizeRef.value = size
    page.value = 1
    load()
  }

  function resetFilters() {
    search.value = ''
    for (const key of Object.keys(filters)) filters[key] = ''
    page.value = 1
    load()
  }

  if (immediate) onMounted(load)

  return {
    rows,
    loading,
    total,
    page,
    pageSize: pageSizeRef,
    search,
    filters,
    load,
    onSearchInput,
    onFilterChange,
    onPageChange,
    onSizeChange,
    resetFilters,
    buildParams,
  }
}

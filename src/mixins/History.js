import { useDb } from '@/services/IdbConnection'
import { ref, watch } from '@vue/composition-api'
import { useAsyncFilter } from '@/mixins/UseAsyncTableFilter'
import { debounce } from '@/helpers'

const IDB_TABLE_NAMES = {
  REST: 'rest',
  SEARCH: 'search'
}
const IDB_TABLE_DEFINITIONS = {
  [IDB_TABLE_NAMES.REST]: {
    indexes: ['date'],
    filterableColumns: ['method', 'url']
  },
  [IDB_TABLE_NAMES.SEARCH]: {
    indexes: ['date'],
    filterableColumns: ['url']
  }
}

export const useHistory = tableName => {
  const { connection } = useDb(tableName)
  connection.initialize()
  const selectedItem = ref(null)

  const setSelectedItem = item => (selectedItem.value = item)
  const favoriteItem = item => connection.dbUpdate(Object.assign({}, item, { favorite: !item.favorite ? 1 : 0 }))
  const removeItem = id => connection.dbDelete(id)
  const clear = () => {
    if (confirm('Are you sure? This will remove all entries from your history.')) connection.dbClear()
  }
  const clearNonFavorites = () => {
    connection.dbClearNonFavorites()
  }

  const filter = ref('')
  const onlyFavorites = ref(false)
  const items = ref([])

  const { asyncFilterTable } = useAsyncFilter()

  const filterTable = async () => {
    let results = connection.entries.value
    if (onlyFavorites.value) results = results.filter(entry => entry.favorite === 1)
    items.value = await asyncFilterTable(results, filter.value, IDB_TABLE_DEFINITIONS[tableName].filterableColumns)
  }
  const debouncedFilterTable = debounce(filterTable, 350)
  watch(filter, debouncedFilterTable)
  watch([onlyFavorites, connection.entries], filterTable)

  return {
    selectedItem,
    connection,
    loading: connection.loading,
    setSelectedItem,
    favoriteItem,
    removeItem,
    clear,
    clearNonFavorites,
    items,
    filter,
    onlyFavorites
  }
}
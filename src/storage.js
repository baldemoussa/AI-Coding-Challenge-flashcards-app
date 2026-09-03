const STORAGE_KEY = 'flashcards-app-state'
const STORAGE_VERSION = 1

/**
 * Load state from localStorage. Invalid, missing, or outdated data returns the fallback.
 * @template T
 * @param {T} fallbackState
 * @returns {T}
 */
export function loadState(fallbackState) {
  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)
    if (!rawState) return fallbackState

    const storedState = JSON.parse(rawState)
    if (
      storedState?.version !== STORAGE_VERSION
      || storedState.data === null
      || typeof storedState.data !== 'object'
    ) {
      return fallbackState
    }

    return storedState.data
  } catch {
    return fallbackState
  }
}

/**
 * Save state to localStorage using a versioned envelope.
 * Storage failures are intentionally ignored so the app remains usable in memory.
 * @template T
 * @param {T} state
 * @returns {void}
 */
export function saveState(state) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, data: state }),
    )
  } catch {
    // localStorage may be unavailable or full; in-memory state still works.
  }
}

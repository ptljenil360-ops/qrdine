import { useState, useEffect } from 'react'
import { subscribeToTables } from '../firebase/firestore'

/**
 * useTables — real-time table status listener.
 *
 * Contract from RaShoyi_Firebase_Setup.md:
 * useTables(restaurantId)
 * Returns: { tables, loading, error }
 *
 * @param {string} restaurantId
 */
export function useTables(restaurantId) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!restaurantId) {
      setTables([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToTables(restaurantId, (data) => {
      setTables(data)
      setLoading(false)
    })

    return unsubscribe
  }, [restaurantId])

  return { tables, loading, error }
}

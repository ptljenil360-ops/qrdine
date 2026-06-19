import { useState, useEffect } from 'react'
import { subscribeToMenu } from '../firebase/firestore'

/**
 * useMenu — real-time menu listener for a restaurant.
 *
 * Contract from RaShoyi_Firebase_Setup.md:
 * useMenu(restaurantId)
 * Returns: { menu, loading, error }
 *
 * Used on both owner dashboard (edit mode) and customer ordering (read-only).
 *
 * @param {string} restaurantId
 */
export function useMenu(restaurantId) {
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!restaurantId) {
      setMenu([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToMenu(restaurantId, (items) => {
      setMenu(items)
      setLoading(false)
    })

    return unsubscribe
  }, [restaurantId])

  return { menu, loading, error }
}

import { useState, useEffect } from 'react'
import { subscribeToRestaurant } from '../firebase/firestore'

/**
 * useRestaurant — real-time restaurant profile listener.
 *
 * Contract from RaShoyi_Firebase_Setup.md:
 * useRestaurant(restaurantId)
 * Returns: { restaurant, loading, error }
 *
 * @param {string} restaurantId
 */
export function useRestaurant(restaurantId) {
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!restaurantId) {
      setRestaurant(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToRestaurant(restaurantId, (data) => {
      setRestaurant(data)
      setLoading(false)
    })

    return unsubscribe
  }, [restaurantId])

  return { restaurant, loading, error }
}

import { useState, useEffect } from 'react'
import { subscribeToOrders } from '../firebase/firestore'

/**
 * useOrders — real-time order listener with status filtering.
 *
 * Contract from RaShoyi_Firebase_Setup.md:
 * useOrders(restaurantId, statusFilter)
 * Returns: { orders, loading, error }
 *
 * @param {string} restaurantId
 * @param {string[]} statusFilter - e.g. ['pending', 'preparing']
 */
export function useOrders(restaurantId, statusFilter = ['pending', 'preparing']) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!restaurantId || !statusFilter.length) {
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToOrders(restaurantId, statusFilter, (data) => {
      setOrders(data)
      setLoading(false)
    })

    return unsubscribe
  }, [restaurantId, JSON.stringify(statusFilter)])

  return { orders, loading, error }
}

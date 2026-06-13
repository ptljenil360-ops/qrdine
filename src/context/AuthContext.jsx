import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { subscribeToRestaurant } from '../firebase/firestore'

const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the app and provides auth state to all children.
 *
 * Listens to Firebase onAuthStateChanged and subscribes to the restaurant profile
 * in real-time. Provides: user, restaurant, loading, isAuthenticated, restaurantId.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeRestaurant = null

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeRestaurant) {
        unsubscribeRestaurant()
        unsubscribeRestaurant = null
      }

      if (firebaseUser) {
        setUser(firebaseUser)
        unsubscribeRestaurant = subscribeToRestaurant(firebaseUser.uid, (profile) => {
          if (profile === null) {
            auth.signOut();
            setUser(null);
            setRestaurant(null);
          } else {
            setRestaurant(profile)
          }
          setLoading(false)
        }, (error) => {
          console.error('Error subscribing to restaurant:', error);
          setLoading(false);
        })
      } else {
        setUser(null)
        setRestaurant(null)
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeRestaurant) {
        unsubscribeRestaurant()
      }
    }
  }, [])

  const value = {
    user,
    restaurant,
    loading,
    isAuthenticated: !!user,
    restaurantId: user?.uid || null,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth hook — consumes AuthContext.
 * @returns {{ user, restaurant, loading, isAuthenticated, restaurantId }}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

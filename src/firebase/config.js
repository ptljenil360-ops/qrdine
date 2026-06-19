import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

/**
 * Firebase client configuration.
 * All values loaded from environment variables (Vite exposes VITE_ prefixed vars).
 * See .env.example for required keys.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain-placeholder",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rashoyi-mock",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rashoyi-mock.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890",
}

const app = initializeApp(firebaseConfig)

// Initialize Firestore with robust offline persistence properly
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})

export const auth = getAuth(app)
export const functions = getFunctions(app)
export const storage = getStorage(app)

// Initialize App Check (DPDPA/Security rule reinforcement)
if (typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (siteKey) {
    // If we are in development, enable the debug token
    if (import.meta.env.DEV) {
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  }
}

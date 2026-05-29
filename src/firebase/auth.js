import {
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updatePassword,
  updateEmail,
  deleteUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'

const LOGIN_REGISTRY_COLLECTION = 'loginRegistry'
const LEGACY_LOGIN_REGISTRY_COLLECTION = 'licenseRegistry'

export const AUTH_ERRORS = {
  USERNAME_ALREADY_REGISTERED: 'This username is already registered.',
  USERNAME_NOT_FOUND: 'Username not found. Please check and try again.',
  LICENSE_ALREADY_REGISTERED: 'This username is already registered.',
  LICENSE_NOT_FOUND: 'Username not found. Please check and try again.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect username or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again after some time.',
  'auth/network-request-failed': 'No internet connection. Please check your network.',
  'auth/email-already-in-use': 'This email address is already in use by another account.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-phone-number': 'Invalid phone number format.',
  'auth/invalid-verification-code': 'Invalid OTP code.',
  'auth/code-expired': 'OTP code has expired. Please request a new one.',
  'auth/unauthorized-domain': 'This domain is not authorized for Phone Auth. Please add it to your Firebase authorized domains.',
  'auth/invalid-app-credential': 'Invalid app credential. Please check your Firebase web config.',
  'auth/app-not-authorized': 'App not authorized. Please check your Firebase console Phone Auth settings.',
  'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
  PHONE_ALREADY_REGISTERED: 'This phone number is already registered to an account.',
  NO_ACCOUNT_FOUND: 'No account found. Please sign up first.',
}

export function getAuthErrorMessage(error) {
  const code = error?.code || error?.message || 'unknown'
  if (AUTH_ERRORS[code]) return AUTH_ERRORS[code]
  if (error?.message) return `Error (${code}): ${error.message}`
  return 'Something went wrong. Please try again.'
}

export function normalizeUsername(username) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function setupRecaptcha(containerId) {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear()
    } catch (err) {
      console.warn('Error clearing previous recaptchaVerifier:', err)
    }
    window.recaptchaVerifier = null
  }

  const element = document.getElementById(containerId)
  if (!element) {
    console.warn(`reCAPTCHA container #${containerId} not found in DOM yet.`)
    return
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  })
}

export async function sendPhoneOtp(phoneNumber) {
  if (!window.recaptchaVerifier) {
    throw new Error('Recaptcha not initialized')
  }
  return await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
}

export async function verifyPhoneOtpForSignup(confirmationResult, otpCode) {
  const result = await confirmationResult.confirm(otpCode)
  const uid = result.user.uid

  const snap = await getDoc(doc(db, 'restaurants', uid))
  if (snap.exists()) {
    await signOut(auth)
    throw new Error('PHONE_ALREADY_REGISTERED')
  }

  return result.user
}

export async function verifyPhoneOtpForLogin(confirmationResult, otpCode) {
  const result = await confirmationResult.confirm(otpCode)
  const uid = result.user.uid

  const snap = await getDoc(doc(db, 'restaurants', uid))
  if (!snap.exists()) {
    await signOut(auth)
    throw new Error('NO_ACCOUNT_FOUND')
  }

  return result.user
}

export async function isUsernameAvailable(username) {
  const normalizedUsername = normalizeUsername(username)
  if (!normalizedUsername) return false

  const loginRef = doc(db, LOGIN_REGISTRY_COLLECTION, normalizedUsername)
  const legacyLoginRef = doc(
    db,
    LEGACY_LOGIN_REGISTRY_COLLECTION,
    normalizedUsername.toUpperCase()
  )
  const [loginSnap, legacyLoginSnap] = await Promise.all([
    getDoc(loginRef),
    getDoc(legacyLoginRef),
  ])

  return !loginSnap.exists() && !legacyLoginSnap.exists()
}

export async function completeSignup({
  username,
  licenseNumber,
  fullName,
  restaurantName,
  phone,
  email,
  password,
}) {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated via phone')

  const normalizedUsername = normalizeUsername(username || licenseNumber || '')
  if (!normalizedUsername) throw new Error('USERNAME_NOT_FOUND')

  const available = await isUsernameAvailable(normalizedUsername)
  if (!available) throw new Error('USERNAME_ALREADY_REGISTERED')

  const cleanEmail = email?.trim()
  const registrationEmail = cleanEmail || `${normalizedUsername}@qrdine.internal`

  await updateEmail(user, registrationEmail)
  await updatePassword(user, password)

  const uid = user.uid

  await setDoc(doc(db, 'restaurants', uid), {
    name: restaurantName.trim(),
    ownerName: fullName.trim(),
    phone: phone.trim(),
    email: cleanEmail || '',
    emailVerified: false,
    phoneVerified: true,
    username: normalizedUsername,
    loginId: normalizedUsername,
    licenseNumber: '',
    address: '',
    logo: '',
    gstNumber: '',
    gstRate: 5,
    language: 'en',
    plan: 'trial',
    planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ownerId: uid,
    onboardingComplete: false,
    createdAt: new Date(),
  })

  await setDoc(doc(db, LOGIN_REGISTRY_COLLECTION, normalizedUsername), {
    uid,
    email: registrationEmail,
    username: normalizedUsername,
    phone: phone.trim(),
  })

  return user
}

export async function loginWithUsername({ username, password }) {
  const normalizedUsername = normalizeUsername(username)
  if (!normalizedUsername) throw new Error('USERNAME_NOT_FOUND')

  const loginRef = doc(db, LOGIN_REGISTRY_COLLECTION, normalizedUsername)
  const loginSnap = await getDoc(loginRef)
  let loginData = loginSnap.exists() ? loginSnap.data() : null

  if (!loginData) {
    const legacyLoginRef = doc(
      db,
      LEGACY_LOGIN_REGISTRY_COLLECTION,
      normalizedUsername.toUpperCase()
    )
    const legacyLoginSnap = await getDoc(legacyLoginRef)
    loginData = legacyLoginSnap.exists() ? legacyLoginSnap.data() : null
  }

  if (!loginData?.email) throw new Error('USERNAME_NOT_FOUND')

  return await signInWithEmailAndPassword(auth, loginData.email, password)
}

export async function loginWithLicense({ licenseNumber, password }) {
  return loginWithUsername({ username: licenseNumber, password })
}

export async function sendVerification() {
  const user = auth.currentUser
  if (user && user.email && !user.email.endsWith('@qrdine.internal')) {
    await sendEmailVerification(user)
    return true
  }
  return false
}

export async function deleteUserAccount(user) {
  if (!user) throw new Error('No user is currently signed in.')
  try {
    await deleteUser(user)
    return true
  } catch (error) {
    console.error('Error deleting account:', error)
    throw error
  }
}

export async function logout() {
  await signOut(auth)
}

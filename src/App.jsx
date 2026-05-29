import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ui/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'

/* ── Auth Pages ── */
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'

/* ── Onboarding ── */
import OnboardingPage from './pages/onboarding/OnboardingPage'

/* ── Public Landing Page ── */
import LandingPage from './pages/LandingPage'

/* ── Dashboard Pages ── */
import HomePage from './pages/dashboard/HomePage'
import OrdersPage from './pages/dashboard/OrdersPage'
import MenuPage from './pages/dashboard/MenuPage'
import TablesPage from './pages/dashboard/TablesPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import BillsPage from './pages/dashboard/BillsPage'
import KitchenPage from './pages/dashboard/KitchenPage'

/* ── Customer Pages (Public) ── */
import CustomerMenuPage from './pages/order/CustomerMenuPage'
import CartPage from './pages/order/CartPage'
import ConfirmationPage from './pages/order/ConfirmationPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* ── Public Auth Routes ── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* ── Public Customer Ordering Routes ── */}
              <Route path="/order/:restaurantId/:tableId" element={<CustomerMenuPage />} />
              <Route path="/order/:restaurantId/:tableId/cart" element={<CartPage />} />
              <Route path="/order/:restaurantId/:tableId/confirmed" element={<ConfirmationPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

              {/* ── Protected Onboarding ── */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />

              {/* ── Protected Dashboard Routes ── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="kitchen" element={<KitchenPage />} />
                <Route path="bills" element={<BillsPage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="tables" element={<TablesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

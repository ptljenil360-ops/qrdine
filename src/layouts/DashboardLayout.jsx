import { Outlet } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import Navbar from '../components/dashboard/Navbar'

/**
 * DashboardLayout — the owner dashboard shell.
 *
 * Layout from QRDine_UI_Brief.md:
 * ┌─────────────────────────────────────────────┐
 * │              TOP NAV BAR (64px)              │
 * ├──────────┬──────────────────────────────────┤
 * │ SIDEBAR  │       MAIN CONTENT AREA          │
 * │ (240px)  │       (flex-1, scrollable)        │
 * └──────────┴──────────────────────────────────┘
 *
 * - Sidebar: dark bg, navigation items, collapses on tablet
 * - Mobile: bottom tab bar instead of sidebar
 */
export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-base-bg)] transition-colors duration-300">
      {/* Sidebar — hidden on mobile, icon-only on tablet, full on desktop */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top navbar */}
        <Navbar />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-base-bg)] transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

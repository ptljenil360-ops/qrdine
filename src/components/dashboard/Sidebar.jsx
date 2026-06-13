import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { NAV_ITEMS, MOBILE_TAB_ITEMS } from '../../utils/constants'
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  LayoutGrid,
  Receipt,
  BarChart2,
  ChefHat,
  Settings,
  LogOut,
} from 'lucide-react'
import { logout } from '../../firebase/auth'

/**
 * Map icon string names to Lucide React components.
 */
const ICON_MAP = {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  LayoutGrid,
  Receipt,
  BarChart2,
  ChefHat,
  Settings,
}

export default function Sidebar() {
  const { restaurant, restaurantId } = useAuth()
  const { orders } = useOrders(restaurantId, ['pending', 'preparing'])

  const pendingCount = orders.length

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <>
      {/* ── Desktop & Tablet Sidebar ── */}
      <aside className="hidden md:flex flex-col w-16 lg:w-[220px] bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] transition-all duration-300 shrink-0 border-r border-[var(--color-border)]">
        {/* Logo area */}
        <div className="flex items-center gap-2.5 p-[20px_16px] border-b border-[var(--color-border)] justify-center lg:justify-start">
          <img src="/assets/RaShoyi_logo_circle.png" alt="RaShoyi Logo" className="h-7 w-auto object-contain" />
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon]
            if (!Icon) return null

            if (item.external) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 py-2.5 px-4 text-[var(--color-sidebar-text-muted)] hover:text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover-bg)] rounded-lg transition-all duration-200 group text-[14px] font-medium justify-center lg:justify-start"
                >
                  <Icon size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="hidden lg:block">{item.label}</span>
                </a>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 py-2.5 px-4 transition-all duration-200 group relative text-[14px] font-medium justify-center lg:justify-start ${
                    isActive
                      ? 'text-accent bg-accent/15 border-l-3 border-accent rounded-r-lg rounded-l-none'
                      : 'text-[var(--color-sidebar-text-muted)] hover:text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover-bg)] border-l-3 border-transparent rounded-lg'
                  }`
                }
              >
                <Icon size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:block">{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="absolute right-1 lg:right-4 gradient-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom section: plan badge + logout */}
        <div className="border-t border-[var(--color-border)] p-4 space-y-4 flex flex-col justify-center lg:justify-start">
          {restaurant?.plan && (
            <div className="hidden lg:block">
              <span className="text-[10px] font-semibold text-[var(--color-sidebar-text-muted)] tracking-[0.1em] uppercase">PLAN</span>
              <p className="text-[13px] font-semibold text-accent mt-0.5 capitalize">
                {restaurant.plan === 'trial' ? 'Trial' : restaurant.plan}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full py-2 text-[var(--color-sidebar-text-muted)] hover:text-error transition-colors duration-200 text-[14px] font-medium justify-center lg:justify-start group"
          >
            <LogOut size={18} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Tab Bar (Glassmorphism) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card bg-[var(--color-navbar-bg)]/80 border-t border-[var(--color-border)] z-50 flex justify-around items-center h-[68px] pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {MOBILE_TAB_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          if (!Icon) return null

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-2 min-w-[44px] min-h-[44px] relative transition-colors duration-300 ${
                  isActive ? 'text-accent' : 'text-[var(--color-text-muted)]'
                }`
              }
            >
              <Icon size={20} className="transition-transform duration-300 active:scale-90" />
              <span className="text-[11px] font-medium">{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="absolute top-1 right-2 gradient-accent shadow-sm text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
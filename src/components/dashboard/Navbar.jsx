import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Menu, Moon, Sun } from 'lucide-react'
import InstallPwaButton from '../ui/InstallPwaButton'

/**
 * Navbar — top navigation bar for the owner dashboard.
 *
 * Layout from UI Brief:
 * [QRDine Logo]          [Restaurant Name]  [Theme Toggle] [Avatar]
 * Height: 64px
 */
export default function Navbar() {
  const { restaurant } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-[var(--color-navbar-bg)] border-b border-[var(--color-border)] shrink-0 z-10 transition-colors duration-300">
      {/* Left: Mobile menu trigger + logo */}
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Menu">
          <Menu size={20} className="text-[var(--color-text-secondary)]" />
        </button>
        <span className="text-accent font-bold text-lg md:hidden">QRDine</span>
      </div>

      {/* Center: Restaurant name */}
      <div className="hidden md:flex items-center gap-3">
        {restaurant?.logo ? (
          <img
            src={restaurant.logo}
            alt={`${restaurant.name} logo`}
            className="w-9 h-9 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[var(--color-base-bg)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] font-semibold text-sm">
            {restaurant?.name?.charAt(0)?.toUpperCase() || 'R'}
          </div>
        )}
        <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate max-w-xs">
          {restaurant?.name || 'My Restaurant'}
        </h1>
      </div>

      {/* Right: Theme Toggle & Avatar */}
      <div className="flex items-center gap-4">
        {/* Install PWA Button */}
        <InstallPwaButton className="hidden sm:inline-flex" />

        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode} 
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <Sun size={20} color="#94A3B8" className="animate-fade-in" />
          ) : (
            <Moon size={20} color="#94A3B8" className="animate-fade-in" />
          )}
        </button>

        <div className="w-9 h-9 rounded-full gradient-accent shadow-md flex items-center justify-center text-white font-bold text-[14px]">
          {restaurant?.ownerName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}

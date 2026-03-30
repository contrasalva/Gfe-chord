import { Routes, Route } from 'react-router-dom'
import { Music, ListMusic, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import SongsPage from '../../features/songs/SongsPage'
import SongDetailPage from '../../features/songs/SongDetailPage'
import SetlistsPage from '../../features/setlists/SetlistsPage'
import SetlistDetailPage from '../../features/setlists/SetlistDetailPage'

// Placeholder pages
function ProfilePage() {
  return (
    <div className="p-6">
      <h1 className="font-sans text-2xl font-bold text-[#E0E1E3]">Perfil</h1>
      <p className="text-[#B1B3B1] mt-2">Configuración de cuenta.</p>
    </div>
  )
}

const navItems = [
  { to: '/songs', icon: Music, label: 'Canciones' },
  { to: '/setlists', icon: ListMusic, label: 'Setlists' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-svh bg-[#1F211F]">
      {/* Contenido principal */}
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<SongsPage />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/songs/:id" element={<SongDetailPage />} />
          <Route path="/setlists" element={<SetlistsPage />} />
          <Route path="/setlists/:id" element={<SetlistDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>

      {/* Bottom nav (móvil) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#2a2d2a] border-t border-[#353835]
                      pb-[env(safe-area-inset-bottom)] md:hidden z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 cursor-pointer
                 transition-colors min-w-[44px] min-h-[44px] justify-center
                 ${isActive ? 'text-[#754456]' : 'text-[#B1B3B1] hover:text-[#E0E1E3]'}`
              }
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

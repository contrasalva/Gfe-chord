import { useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { Music, ListMusic, User, Pin, PinOff, Clock } from 'lucide-react'
import { useSongsStore } from '../../store/songs.store'
import { useSetlistsStore } from '../../store/setlists.store'
import AlphabeticAccordion from './AlphabeticAccordion'
import { groupSongsByLetter } from '../utils/groupSongsByLetter'
import type { Song } from '../types'

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { to: '/songs', icon: Music, label: 'Canciones' },
  { to: '/setlists', icon: ListMusic, label: 'Setlists' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const navigate = useNavigate()

  // Songs store
  const { songs, isLoading, fetchSongs } = useSongsStore()

  // Setlists store — pinned and recent now carry {id, name} directly
  const {
    pinnedSetlistIds,
    recentSetlistIds,
    pinSetlist,
    unpinSetlist,
  } = useSetlistsStore()

  // Fetch songs on mount if not yet loaded
  useEffect(() => {
    fetchSongs()
  }, [fetchSongs])

  const groups = groupSongsByLetter(songs)

  const handleSongClick = (song: Song) => {
    navigate(`/songs/${song.id}`)
  }

  // Build pinned and recent setlist objects — refs already carry {id, name}
  const pinnedSetlists = pinnedSetlistIds
  const recentSetlists = recentSetlistIds

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#2A2D2A] border-r border-[#3A3D3A] overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[#3A3D3A] shrink-0">
        <Music size={20} className="text-[#754456]" />
        <span className="font-semibold text-[#E0E1E3] text-base tracking-tight">
          GFE Chord
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-3 shrink-0">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
               transition-colors duration-200 min-h-[44px]
               ${isActive
                 ? 'bg-[#754456]/20 text-[#754456]'
                 : 'text-[#B1B3B1] hover:bg-[#333633] hover:text-[#E0E1E3]'
               }`
            }
          >
            <Icon size={20} />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-[#3A3D3A] mx-3" />

      {/* Songs section — compact accordion */}
      <div className="flex flex-col mt-3 shrink-0">
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#B1B3B1]">
          Canciones
        </p>

        {isLoading && (
          <div className="px-3 py-2 space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 bg-[#353835] rounded animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && songs.length > 0 && (
          <AlphabeticAccordion
            groups={groups}
            onSongClick={handleSongClick}
            compact
          />
        )}

        {!isLoading && songs.length === 0 && (
          <p className="px-3 py-2 text-[10px] text-[#B1B3B1]">Sin canciones</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#3A3D3A] mx-3 mt-2" />

      {/* Pinned setlists */}
      <div className="flex flex-col mt-3 shrink-0">
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#B1B3B1]">
          Fijados
        </p>

        {pinnedSetlists.length === 0 ? (
          <p className="px-3 py-1.5 text-[10px] text-[#B1B3B1]">
            No hay setlists fijados
          </p>
        ) : (
          <ul>
            {pinnedSetlists.map((setlist) => (
              <li key={setlist.id} className="group flex items-center">
                <button
                  onClick={() => navigate(`/setlists/${setlist.id}`)}
                  className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 min-h-[44px]
                             text-left hover:bg-[#333633] transition-colors duration-200 cursor-pointer"
                >
                  <Pin size={10} className="text-[#754456] shrink-0" />
                  <span className="text-xs text-[#E0E1E3] truncate">{setlist.name}</span>
                </button>
                <button
                  onClick={() => unpinSetlist(setlist.id)}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center
                             min-w-[44px] min-h-[44px] rounded hover:bg-[#333633] transition-all duration-200
                             cursor-pointer"
                  aria-label={`Desfijar ${setlist.name}`}
                >
                  <PinOff size={11} className="text-[#B1B3B1]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#3A3D3A] mx-3 mt-2" />

      {/* Recent setlists */}
      <div className="flex flex-col mt-3 pb-4 shrink-0">
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#B1B3B1]">
          Recientes
        </p>

        {recentSetlists.length === 0 ? (
          <p className="px-3 py-1.5 text-[10px] text-[#B1B3B1]">
            No hay visitas recientes
          </p>
        ) : (
          <ul>
            {recentSetlists.map((setlist) => (
              <li key={setlist.id} className="group flex items-center">
                <button
                  onClick={() => navigate(`/setlists/${setlist.id}`)}
                  className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 min-h-[44px]
                             text-left hover:bg-[#333633] transition-colors duration-200 cursor-pointer"
                >
                  <Clock size={10} className="text-[#B1B3B1] shrink-0" />
                  <span className="text-xs text-[#E0E1E3] truncate">{setlist.name}</span>
                </button>
                <button
                  onClick={() => pinSetlist({ id: setlist.id, name: setlist.name })}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center
                             min-w-[44px] min-h-[44px] rounded hover:bg-[#333633] transition-all duration-200
                             cursor-pointer"
                  aria-label={`Fijar ${setlist.name}`}
                >
                  <Pin size={11} className="text-[#B1B3B1]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </aside>
  )
}

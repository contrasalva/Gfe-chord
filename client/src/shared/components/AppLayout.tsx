import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Music, ListMusic, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Toaster, toast } from 'sonner'
import axios from 'axios'
import SongsPage from '../../features/songs/SongsPage'
import SongDetailPage from '../../features/songs/SongDetailPage'
import SetlistsPage from '../../features/setlists/SetlistsPage'
import SetlistDetailPage from '../../features/setlists/SetlistDetailPage'
import Sidebar from './Sidebar'
import { setlistsService } from '../../features/setlists/setlists.service'
import { useSetlistsStore } from '../../store/setlists.store'
import type { Song } from '../types'

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
  const [activeSong, setActiveSong] = useState<Song | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const song = event.active.data.current?.song as Song | undefined
    setActiveSong(song ?? null)
  }

  async function handleSidebarDrop(event: DragEndEvent) {
    if (event.over?.id !== 'setlist-drop-zone') return
    const song = event.active.data.current?.song as Song
    const setlistId = useSetlistsStore.getState().viewingSetlistId
    if (!setlistId || !song) return
    try {
      await setlistsService.addSong(setlistId, { songId: song.id })
      toast.success(`"${song.title}" agregada al setlist`)
      useSetlistsStore.getState().notifySetlistUpdated()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.warning('Ya está en el setlist')
      } else {
        toast.error('Error al agregar canción')
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveSong(null)
    handleSidebarDrop(event)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-svh bg-[#1F211F]">

        {/* Sidebar (desktop) — extracted to Sidebar.tsx */}
        <Sidebar />

        {/* Contenido principal */}
        <main className="flex-1 min-w-0 pb-16 md:pb-0 overflow-y-auto">
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
        <nav className="fixed bottom-0 left-0 right-0 bg-[#2A2D2A] border-t border-[#3A3D3A]
                        pb-[env(safe-area-inset-bottom)] md:hidden z-50">
          <div className="flex items-center justify-around h-16">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-4 py-2 cursor-pointer
                   transition-colors duration-200 min-w-[44px] min-h-[44px] justify-center
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

      {/* Drag overlay — floating song card while dragging */}
      <DragOverlay>
        {activeSong && (
          <div className="bg-[#2A2D2A] border border-[#754456] rounded-lg px-3 py-2 text-sm text-[#E0E1E3] shadow-lg opacity-90 pointer-events-none max-w-[200px] truncate">
            {activeSong.title}
          </div>
        )}
      </DragOverlay>

      {/* Toast notifications */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2A2D2A',
            border: '1px solid #3A3D3A',
            color: '#E0E1E3',
          },
        }}
      />
    </DndContext>
  )
}

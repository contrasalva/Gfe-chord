import { api } from '../../shared/utils/api'
import type { Setlist, SetlistSong } from '../../shared/types'

// ─── Response shapes ────────────────────────────────────────────────────────

interface SetlistsResponse {
  ok: true
  setlists: Setlist[]
}

interface SetlistResponse {
  ok: true
  setlist: Setlist
}

interface AddSongResponse {
  ok: true
  setlistSong: SetlistSong
}

interface RemoveSongResponse {
  ok: true
  message: string
}

// ─── Payload types ──────────────────────────────────────────────────────────

export interface CreateSetlistPayload {
  name: string
  serviceDate?: string
}

export interface UpdateSetlistPayload {
  name?: string
  serviceDate?: string
}

export interface PatchSongPayload {
  transposeOffset?: number
  order?: number
}

/** Each item identifies the SetlistSong by its own PK (`id`), not the Song FK */
export interface ReorderSongsPayload {
  id: string
  order: number
}

// ─── Service ────────────────────────────────────────────────────────────────

export const setlistsService = {
  getAll: () =>
    api.get<SetlistsResponse>('/setlists'),

  getById: (id: string) =>
    api.get<SetlistResponse>(`/setlists/${id}`),

  create: (data: CreateSetlistPayload) =>
    api.post<SetlistResponse>('/setlists', data),

  update: (id: string, data: UpdateSetlistPayload) =>
    api.put<SetlistResponse>(`/setlists/${id}`, data),

  delete: (id: string) =>
    api.delete<{ ok: true }>(`/setlists/${id}`),

  addSong: (id: string, data: { songId: string }) =>
    api.post<AddSongResponse>(`/setlists/${id}/songs`, data),

  /** songId here is the SetlistSong PK (junction table id), NOT the Song id */
  removeSong: (id: string, setlistSongId: string) =>
    api.delete<RemoveSongResponse>(`/setlists/${id}/songs/${setlistSongId}`),

  /** songId here is the SetlistSong PK (junction table id), NOT the Song id */
  patchSong: (id: string, setlistSongId: string, data: PatchSongPayload) =>
    api.patch<SetlistResponse>(`/setlists/${id}/songs/${setlistSongId}`, data),

  reorderSongs: (id: string, songs: ReorderSongsPayload[]) =>
    api.put<SetlistResponse>(`/setlists/${id}/songs/reorder`, { songs }),

  /** userId goes in the URL path — backend: POST /api/setlists/:id/share/:userId */
  share: (id: string, userId: string) =>
    api.post<{ ok: true }>(`/setlists/${id}/share/${userId}`),

  unshare: (id: string, userId: string) =>
    api.delete<{ ok: true }>(`/setlists/${id}/share/${userId}`),
}

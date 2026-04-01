import { api } from '../../shared/utils/api'
import type { Song } from '../../shared/types'

interface SongsParams {
  search?: string
  tag?: string
  key?: string
}

export interface UpdateSongPayload {
  title?: string
  artist?: string | null
  key?: string | null
  capo?: number
  bpm?: number | null
  timeSignature?: string | null
  content?: string
  tags?: string[]
}

interface SongsResponse {
  ok: boolean
  songs: Song[]
}

interface SongResponse {
  ok: boolean
  song: Song
}

export const songsService = {
  async getAll(params?: SongsParams): Promise<Song[]> {
    const { data } = await api.get<SongsResponse>('/songs', { params })
    return data.songs
  },

  async getById(id: string): Promise<Song> {
    const { data } = await api.get<SongResponse>(`/songs/${id}`)
    return data.song
  },

  async update(id: string, payload: UpdateSongPayload): Promise<Song> {
    const { data } = await api.put<SongResponse>(`/songs/${id}`, payload)
    return data.song
  },
}

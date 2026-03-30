import { api } from '../../shared/utils/api'
import type { Song } from '../../shared/types'

interface SongsParams {
  search?: string
  tag?: string
  key?: string
}

export const songsService = {
  async getAll(params?: SongsParams): Promise<Song[]> {
    const { data } = await api.get<Song[]>('/songs', { params })
    return data
  },

  async getById(id: string): Promise<Song> {
    const { data } = await api.get<Song>(`/songs/${id}`)
    return data
  },
}

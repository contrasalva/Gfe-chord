// Tipos compartidos de la aplicación

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl?: string | null
}

export interface Song {
  id: string
  title: string
  artist?: string | null
  key?: string | null
  capo: number
  bpm?: number | null
  timeSignature?: string | null
  content: string
  tags: string[]
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface SetlistShare {
  id: string
  setlistId: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'email'>
}

export interface SetlistSong {
  id: string
  setlistId: string
  songId: string
  order: number
  transposeOffset: number
  song: Pick<Song, 'id' | 'title' | 'artist' | 'key' | 'content'>
}

export interface Setlist {
  id: string
  name: string
  serviceDate?: string | null
  createdById: string
  songs: SetlistSong[]
  shares: SetlistShare[]
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  message?: string
  code?: string
}

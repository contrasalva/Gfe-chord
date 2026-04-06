import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/errors'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// ─── Schemas ────────────────────────────────────────────────────────────────

const createSetlistSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  serviceDate: z.string().optional(),
})

const updateSetlistSchema = createSetlistSchema.partial()

const addSongSchema = z.object({
  songId: z.string().min(1, 'songId es requerido'),
})

const updateSongInSetlistSchema = z.object({
  transposeOffset: z.number().int().min(-6).max(6).optional(),
  order: z.number().int().min(0).optional(),
})

const reorderSchema = z.object({
  songs: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
})

const shareSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const setlistSongSelect = {
  id: true,
  setlistId: true,
  songId: true,
  order: true,
  transposeOffset: true,
  song: {
    select: {
      id: true,
      title: true,
      artist: true,
      key: true,
    },
  },
} as const

// Select extendido para el detalle — incluye content para ChordRenderer en modo presentación
const setlistSongDetailSelect = {
  ...setlistSongSelect,
  song: {
    select: {
      id: true,
      title: true,
      artist: true,
      key: true,
      content: true,
    },
  },
} as const

const setlistShareSelect = {
  id: true,
  setlistId: true,
  userId: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const

const setlistSelect = {
  id: true,
  name: true,
  serviceDate: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  songs: {
    select: setlistSongSelect,
    orderBy: { order: 'asc' as const },
  },
  shares: {
    select: setlistShareSelect,
  },
} as const

// Select para GET /:id — songs incluyen content para ChordRenderer en modo presentación
const setlistDetailSelect = {
  ...setlistSelect,
  songs: {
    select: setlistSongDetailSelect,
    orderBy: { order: 'asc' as const },
  },
} as const

// ─── GET /api/setlists ────────────────────────────────────────────────────────

router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!

    // Role-based visibility:
    // ADMIN: all setlists
    // EDITOR: own setlists + shared
    // VIEWER: only shared
    const where =
      role === 'ADMIN'
        ? {}
        : role === 'EDITOR'
          ? { OR: [{ createdById: userId }, { shares: { some: { userId } } }] }
          : { shares: { some: { userId } } }

    const setlists = await prisma.setlist.findMany({
      where,
      select: setlistSelect,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ ok: true, setlists })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/setlists ───────────────────────────────────────────────────────

router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!

    // Only ADMIN and EDITOR can create setlists
    if (role !== 'ADMIN' && role !== 'EDITOR') {
      throw new AppError(403, 'Sin permisos para crear setlists', 'FORBIDDEN')
    }

    const data = createSetlistSchema.parse(req.body)

    const setlist = await prisma.setlist.create({
      data: {
        name: data.name,
        serviceDate: data.serviceDate ? new Date(data.serviceDate) : null,
        createdById: userId,
      },
      select: setlistSelect,
    })

    res.status(201).json({ ok: true, setlist })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/setlists/:id ────────────────────────────────────────────────────

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!
    const id = req.params['id'] as string

    const setlist = await prisma.setlist.findUnique({
      where: { id },
      select: setlistDetailSelect,
    })

    if (!setlist) {
      throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
    }

    // Access check: ADMIN sees all, owner sees own, shared user sees shared
    const isOwner = setlist.createdById === userId
    const isShared = setlist.shares.some((s: { userId: string }) => s.userId === userId)

    if (role !== 'ADMIN' && !isOwner && !isShared) {
      throw new AppError(403, 'Sin permisos para ver esta setlist', 'FORBIDDEN')
    }

    res.json({ ok: true, setlist })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/setlists/:id ────────────────────────────────────────────────────

router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!
    const id = req.params['id'] as string

    const existing = await prisma.setlist.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    })

    if (!existing) {
      throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
    }

    // Only owner or ADMIN can update
    const isOwner = existing.createdById === userId
    if (role !== 'ADMIN' && !isOwner) {
      throw new AppError(403, 'Sin permisos para modificar esta setlist', 'FORBIDDEN')
    }

    const data = updateSetlistSchema.parse(req.body)

    const setlist = await prisma.setlist.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.serviceDate !== undefined
          ? { serviceDate: data.serviceDate ? new Date(data.serviceDate) : null }
          : {}),
      },
      select: setlistSelect,
    })

    res.json({ ok: true, setlist })
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /api/setlists/:id ─────────────────────────────────────────────────

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!
    const id = req.params['id'] as string

    const existing = await prisma.setlist.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    })

    if (!existing) {
      throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
    }

    // Only owner or ADMIN can delete
    const isOwner = existing.createdById === userId
    if (role !== 'ADMIN' && !isOwner) {
      throw new AppError(403, 'Sin permisos para eliminar esta setlist', 'FORBIDDEN')
    }

    await prisma.setlist.delete({ where: { id } })

    res.json({ ok: true, message: 'Setlist eliminada' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/setlists/:id/songs ─────────────────────────────────────────────

router.post(
  '/:id/songs',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.user!
      const id = req.params['id'] as string

      const setlist = await prisma.setlist.findUnique({
        where: { id },
        select: {
          id: true,
          createdById: true,
          songs: { select: { order: true, songId: true } },
        },
      })

      if (!setlist) {
        throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
      }

      // Only owner or ADMIN can add songs
      const isOwner = setlist.createdById === userId
      if (role !== 'ADMIN' && !isOwner) {
        throw new AppError(403, 'Sin permisos para modificar esta setlist', 'FORBIDDEN')
      }

      const data = addSongSchema.parse(req.body)

      // Check for duplicate
      const isDuplicate = setlist.songs.some((s: { songId: string }) => s.songId === data.songId)
      if (isDuplicate) {
        throw new AppError(409, 'La canción ya está en la setlist', 'DUPLICATE_SONG')
      }

      // Verify song exists
      const song = await prisma.song.findUnique({ where: { id: data.songId } })
      if (!song) {
        throw new AppError(404, 'Canción no encontrada', 'NOT_FOUND')
      }

      const nextOrder = setlist.songs.length > 0
        ? Math.max(...setlist.songs.map((s: { order: number }) => s.order)) + 1
        : 0

      const setlistSong = await prisma.setlistSong.create({
        data: {
          setlistId: id,
          songId: data.songId,
          order: nextOrder,
          transposeOffset: 0,
        },
        select: setlistSongSelect,
      })

      res.status(201).json({ ok: true, setlistSong })
    } catch (err) {
      next(err)
    }
  }
)

// ─── DELETE /api/setlists/:id/songs/:songId ───────────────────────────────────

router.delete(
  '/:id/songs/:songId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.user!
      const id = req.params['id'] as string
      const songId = req.params['songId'] as string

      const setlist = await prisma.setlist.findUnique({
        where: { id },
        select: {
          id: true,
          createdById: true,
          songs: { select: { id: true, order: true, songId: true } },
        },
      })

      if (!setlist) {
        throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
      }

      // Only owner or ADMIN can remove songs
      const isOwner = setlist.createdById === userId
      if (role !== 'ADMIN' && !isOwner) {
        throw new AppError(403, 'Sin permisos para modificar esta setlist', 'FORBIDDEN')
      }

      // Find the SetlistSong record by its own ID (songId param is the SetlistSong.id)
      const setlistSong = setlist.songs.find((s: { id: string }) => s.id === songId)
      if (!setlistSong) {
        throw new AppError(404, 'Canción no encontrada en la setlist', 'NOT_FOUND')
      }

      await prisma.setlistSong.delete({ where: { id: songId } })

      // Close the order gap: reassign orders for songs after the deleted one
      const songsAfter = setlist.songs
        .filter((s: { id: string; order: number }) => s.id !== songId && s.order > setlistSong.order)
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order)

      if (songsAfter.length > 0) {
        await prisma.$transaction(
          songsAfter.map((s: { id: string }, i: number) =>
            prisma.setlistSong.update({
              where: { id: s.id },
              data: { order: setlistSong.order + i },
            })
          )
        )
      }

      res.json({ ok: true, message: 'Canción eliminada de la setlist' })
    } catch (err) {
      next(err)
    }
  }
)

// ─── PATCH /api/setlists/:id/songs/:songId ────────────────────────────────────

router.patch(
  '/:id/songs/:songId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.user!
      const id = req.params['id'] as string
      const songId = req.params['songId'] as string

      const setlist = await prisma.setlist.findUnique({
        where: { id },
        select: { id: true, createdById: true },
      })

      if (!setlist) {
        throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
      }

      // Only owner or ADMIN can update song settings
      const isOwner = setlist.createdById === userId
      if (role !== 'ADMIN' && !isOwner) {
        throw new AppError(403, 'Sin permisos para modificar esta setlist', 'FORBIDDEN')
      }

      const data = updateSongInSetlistSchema.parse(req.body)

      const existing = await prisma.setlistSong.findFirst({
        where: { id: songId, setlistId: id },
      })

      if (!existing) {
        throw new AppError(404, 'Canción no encontrada en la setlist', 'NOT_FOUND')
      }

      const setlistSong = await prisma.setlistSong.update({
        where: { id: songId },
        data: {
          ...(data.transposeOffset !== undefined ? { transposeOffset: data.transposeOffset } : {}),
          ...(data.order !== undefined ? { order: data.order } : {}),
        },
        select: setlistSongSelect,
      })

      res.json({ ok: true, setlistSong })
    } catch (err) {
      next(err)
    }
  }
)

// ─── PUT /api/setlists/:id/songs/reorder ─────────────────────────────────────

router.put(
  '/:id/songs/reorder',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.user!
      const id = req.params['id'] as string

      const setlist = await prisma.setlist.findUnique({
        where: { id },
        select: { id: true, createdById: true },
      })

      if (!setlist) {
        throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
      }

      // Only owner or ADMIN can reorder songs
      const isOwner = setlist.createdById === userId
      if (role !== 'ADMIN' && !isOwner) {
        throw new AppError(403, 'Sin permisos para reordenar esta setlist', 'FORBIDDEN')
      }

      const { songs } = reorderSchema.parse(req.body)

      // Use $transaction with temp negative orders to avoid unique constraint collisions
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Phase 1: set all to negative temp orders
        for (let i = 0; i < songs.length; i++) {
          await tx.setlistSong.update({
            where: { id: songs[i]!.id },
            data: { order: -(i + 1) },
          })
        }
        // Phase 2: set final orders
        for (let i = 0; i < songs.length; i++) {
          await tx.setlistSong.update({
            where: { id: songs[i]!.id },
            data: { order: songs[i]!.order },
          })
        }
      })

      const updated = await prisma.setlist.findUnique({
        where: { id },
        select: setlistSelect,
      })

      res.json({ ok: true, setlist: updated })
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /api/setlists/:id/share/:userId ─────────────────────────────────────

router.post(
  '/:id/share/:userId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: requesterId, role } = req.user!
      const id = req.params['id'] as string
      const targetUserId = req.params['userId'] as string

      const setlist = await prisma.setlist.findUnique({
        where: { id },
        select: { id: true, createdById: true },
      })

      if (!setlist) {
        throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
      }

      // Only owner or ADMIN can share
      const isOwner = setlist.createdById === requesterId
      if (role !== 'ADMIN' && !isOwner) {
        throw new AppError(403, 'Sin permisos para compartir esta setlist', 'FORBIDDEN')
      }

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true },
      })

      if (!targetUser) {
        throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND')
      }

      const share = await prisma.setlistShare.upsert({
        where: { setlistId_userId: { setlistId: id, userId: targetUserId } },
        create: { setlistId: id, userId: targetUserId },
        update: {},
        select: setlistShareSelect,
      })

      res.status(201).json({ ok: true, share })
    } catch (err) {
      next(err)
    }
  }
)

// ─── DELETE /api/setlists/:id/share/:userId ───────────────────────────────────

router.delete(
  '/:id/share/:userId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: requesterId, role } = req.user!
      const id = req.params['id'] as string
      const targetUserId = req.params['userId'] as string

      const setlist = await prisma.setlist.findUnique({
        where: { id },
        select: { id: true, createdById: true },
      })

      if (!setlist) {
        throw new AppError(404, 'Setlist no encontrada', 'NOT_FOUND')
      }

      // Only owner or ADMIN can unshare
      const isOwner = setlist.createdById === requesterId
      if (role !== 'ADMIN' && !isOwner) {
        throw new AppError(403, 'Sin permisos para modificar el acceso de esta setlist', 'FORBIDDEN')
      }

      const existing = await prisma.setlistShare.findUnique({
        where: { setlistId_userId: { setlistId: id, userId: targetUserId } },
      })

      if (!existing) {
        throw new AppError(404, 'El usuario no tiene acceso a esta setlist', 'NOT_FOUND')
      }

      await prisma.setlistShare.delete({
        where: { setlistId_userId: { setlistId: id, userId: targetUserId } },
      })

      res.json({ ok: true, message: 'Acceso revocado' })
    } catch (err) {
      next(err)
    }
  }
)

export default router

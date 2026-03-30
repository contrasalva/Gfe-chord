import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/errors'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// ─── Schemas ────────────────────────────────────────────────────────────────

const createSongSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  artist: z.string().optional(),
  key: z.string().optional(),
  capo: z.number().int().min(0).default(0),
  bpm: z.number().int().positive().optional(),
  timeSignature: z.string().optional(),
  content: z.string().min(1, 'El contenido es requerido'),
  tags: z.array(z.string()).optional(),
})

const updateSongSchema = createSongSchema.partial()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTags(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as string[]
    return []
  } catch {
    return []
  }
}

// ─── GET /api/songs ───────────────────────────────────────────────────────────

router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, tag, key } = req.query as Record<string, string | undefined>

    const songs = await prisma.song.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { artist: { contains: search } },
              ],
            }
          : {}),
        ...(key ? { key } : {}),
      },
      select: {
        id: true,
        title: true,
        artist: true,
        key: true,
        capo: true,
        tags: true,
        updatedAt: true,
      },
      orderBy: { title: 'asc' },
    })

    // Parsear tags y filtrar por tag si se proporcionó
    const result = songs
      .map((song) => ({ ...song, tags: parseTags(song.tags) }))
      .filter((song) => (tag ? song.tags.includes(tag) : true))

    res.json({ ok: true, songs: result })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/songs/:id ───────────────────────────────────────────────────────

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string

    const song = await prisma.song.findUnique({ where: { id } })

    if (!song) {
      throw new AppError(404, 'Canción no encontrada', 'NOT_FOUND')
    }

    res.json({ ok: true, song: { ...song, tags: parseTags(song.tags) } })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/songs ──────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createSongSchema.parse(req.body)

      const song = await prisma.song.create({
        data: {
          title: data.title,
          artist: data.artist,
          key: data.key,
          capo: data.capo,
          bpm: data.bpm,
          timeSignature: data.timeSignature,
          content: data.content,
          tags: JSON.stringify(data.tags ?? []),
          createdById: req.user!.userId,
        },
      })

      res.status(201).json({ ok: true, song: { ...song, tags: parseTags(song.tags) } })
    } catch (err) {
      next(err)
    }
  }
)

// ─── PUT /api/songs/:id ───────────────────────────────────────────────────────

router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params['id'] as string
      const data = updateSongSchema.parse(req.body)

      const existing = await prisma.song.findUnique({ where: { id } })
      if (!existing) {
        throw new AppError(404, 'Canción no encontrada', 'NOT_FOUND')
      }

      const song = await prisma.song.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.artist !== undefined ? { artist: data.artist } : {}),
          ...(data.key !== undefined ? { key: data.key } : {}),
          ...(data.capo !== undefined ? { capo: data.capo } : {}),
          ...(data.bpm !== undefined ? { bpm: data.bpm } : {}),
          ...(data.timeSignature !== undefined ? { timeSignature: data.timeSignature } : {}),
          ...(data.content !== undefined ? { content: data.content } : {}),
          ...(data.tags !== undefined ? { tags: JSON.stringify(data.tags) } : {}),
        },
      })

      res.json({ ok: true, song: { ...song, tags: parseTags(song.tags) } })
    } catch (err) {
      next(err)
    }
  }
)

// ─── DELETE /api/songs/:id ────────────────────────────────────────────────────

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params['id'] as string

      const existing = await prisma.song.findUnique({ where: { id } })
      if (!existing) {
        throw new AppError(404, 'Canción no encontrada', 'NOT_FOUND')
      }

      await prisma.song.delete({ where: { id } })

      res.json({ ok: true, message: 'Canción eliminada' })
    } catch (err) {
      next(err)
    }
  }
)

export default router

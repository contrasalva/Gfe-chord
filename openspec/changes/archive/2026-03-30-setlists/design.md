# Design: Setlists

## Technical Approach

Full-stack CRUD for setlists following the exact patterns established by the songs feature. Schema migration fixes `SetlistShare` (missing User relation) and adds `transposeOffset` to `SetlistSong` in ONE migration. Backend replicates `songs.routes.ts` pattern with inline access-control logic. Frontend creates `features/setlists/` with Zustand store using `partialize`. Transposition uses dual-layer model: persisted `transposeOffset` (leader's base) + in-memory `sessionDelta` (musician's adjustment). `@dnd-kit` for touch-friendly drag & drop reordering.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | Schema fix strategy | Single migration: add `transposeOffset` to `SetlistSong` + add `user` relation to `SetlistShare` + add `sharedSetlists` to `User` | Separate migrations | One atomic migration avoids partial state. Both are additive — zero risk of data loss. |
| 2 | Reorder strategy | `prisma.$transaction` with temp negative orders → then reassign final orders | Individual UPDATEs / delete+recreate | `@@unique([setlistId, order])` causes collision on individual UPDATEs. Temp negative orders (-1, -2...) are never valid real orders, so the first pass clears collisions, second pass sets final values. Delete+recreate loses IDs. |
| 3 | Access control | Inline logic per endpoint, NOT a shared middleware | `requireSetlistAccess` middleware | Each endpoint has different rules (GET list: role-filtered query; GET detail: owner OR admin OR shared; mutations: owner OR admin). A single middleware would need params and become as complex as inline. Songs pattern uses inline — we follow it. |
| 4 | VIEWER access policy | VIEWER sees ONLY setlists shared explicitly via `SetlistShare` | VIEWER sees ALL setlists | Confirmed by user: "MEMBER solo ve setlists compartidos explícitamente". Makes `SetlistShare` critical for the MVP flow. |
| 5 | Zustand store with `partialize` | Persist: `activeSetlistId`, `currentSongIndex`. Exclude: `sessionDeltas`, loading states, songs data | Persist everything | `sessionDeltas` (Map<songId, number>) are intentionally ephemeral — musician's personal adjustment resets each session. Song data comes from API/cache. |
| 6 | Transposition dual model | `finalOffset = transposeOffset (DB) + sessionDelta (memory)` | Single offset (DB-only or session-only) | Leader sets `transposeOffset` once during prep → all musicians see same base. Each musician can then fine-tune with `sessionDelta` without mutating shared state. |
| 7 | DnD library | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | HTML5 DnD / react-beautiful-dnd | Touch support required (tablets in live service). `@dnd-kit` is the maintained standard. `react-beautiful-dnd` is deprecated. HTML5 DnD has no touch support. |
| 8 | Workbox cache | Add `/api/setlists` to `runtimeCaching` with `StaleWhileRevalidate` | NetworkFirst / no cache | Consistent with existing `/api/songs` pattern. Writes are online-only (acceptable for MVP). |

## Data Flow

```
┌─────────────────── BACKEND ───────────────────┐
│                                                │
│  setlists.routes.ts                            │
│    GET /setlists ─────────┐                    │
│    GET /setlists/:id      │ prisma queries     │
│    POST /setlists         │ with role-based    │
│    PUT /setlists/:id      │ WHERE filters      │
│    DELETE /setlists/:id   │                    │
│    POST /:id/songs ───────┤                    │
│    DELETE /:id/songs/:sId │                    │
│    PATCH /:id/songs/:sId ─┤ transposeOffset    │
│    PUT /:id/songs/reorder ┤ $transaction       │
│    POST /:id/share ───────┤                    │
│    DELETE /:id/share/:uId ┘                    │
│                                                │
└───────────────┬────────────────────────────────┘
                │ { ok: true, ...data }
                ▼
┌─────────────────── FRONTEND ──────────────────┐
│                                                │
│  setlists.service.ts ──→ api.ts (axios)        │
│        │                                       │
│        ▼                                       │
│  useSetlistStore (Zustand)                     │
│    ├─ activeSetlistId (persisted)               │
│    ├─ currentSongIndex (persisted)              │
│    └─ sessionDeltas: Map<songId, number> (mem)  │
│        │                                       │
│        ▼                                       │
│  SetlistsPage → SetlistDetailPage → SetlistSongPage
│                   │ @dnd-kit                    │
│                   └─ PATCH reorder on drop      │
│                                                │
│  SetlistSongPage:                              │
│    finalOffset = song.transposeOffset           │
│                  + sessionDeltas[songId]         │
│    ChordRenderer(content, transpose(finalOffset))│
│                                                │
└────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Modify | Add `transposeOffset Int @default(0)` to `SetlistSong`. Add `user User @relation(...)` to `SetlistShare` with `onDelete: Cascade`. Add `sharedSetlists SetlistShare[]` to `User` model. Rename `sharedWith` → `shares` on `Setlist` for consistency with frontend types. |
| `server/src/routes/setlists.routes.ts` | Create | 11 endpoints: CRUD setlists (5) + song management (4) + sharing (2). Zod schemas inline. Access control inline per endpoint. `$transaction` for reorder. |
| `server/src/index.ts` | Modify | Import and mount `setlistRoutes` at `/api/setlists`. |
| `client/src/shared/types/index.ts` | Modify | Add `transposeOffset` to `SetlistSong`. Add `SetlistShare` interface. Add `shares` to `Setlist`. Narrow `SetlistSong.song` to `Pick<Song, 'id' \| 'title' \| 'artist' \| 'key'>`. |
| `client/src/features/setlists/setlists.service.ts` | Create | API service: `getAll`, `getById`, `create`, `update`, `remove`, `addSong`, `removeSong`, `updateSong` (transposeOffset), `reorder`, `share`, `unshare`. |
| `client/src/features/setlists/SetlistsPage.tsx` | Create | List setlists with search, skeleton loading, empty state. Pattern from `SongsPage.tsx`. |
| `client/src/features/setlists/SetlistDetailPage.tsx` | Create | Song list with `@dnd-kit/sortable` for reorder (ADMIN/EDITOR only). Shows transposeOffset badges. Add/remove songs. Container component. |
| `client/src/features/setlists/SetlistSongPage.tsx` | Create | Presentation mode: full-screen chord view with dual transposition. Prev/Next navigation. Hides bottom nav via Zustand flag or CSS. Reuses `ChordRenderer` + `useTranspose` pattern. |
| `client/src/features/setlists/components/SortableSongItem.tsx` | Create | Presentational `@dnd-kit/sortable` wrapper for song items in detail view. Drag handle with grip icon. |
| `client/src/store/setlists.store.ts` | Create | Zustand + persist with `partialize`. State: `activeSetlistId`, `currentSongIndex`, `sessionDeltas`. Actions: `setActive`, `setSongIndex`, `setSessionDelta`, `resetDeltas`. |
| `client/src/shared/components/AppLayout.tsx` | Modify | Remove inline `SetlistsPage` placeholder. Import real pages from `features/setlists/`. Add routes: `/setlists/:id`, `/setlists/:id/play`. |
| `client/vite.config.ts` | Modify | Add `runtimeCaching` entry for `/api/setlists` with `StaleWhileRevalidate`, cache name `setlists-cache`, same expiration as songs. |

## Interfaces / Contracts

### Backend — Zod Schemas

```typescript
// setlists.routes.ts
const createSetlistSchema = z.object({
  name: z.string().min(1),
  serviceDate: z.string().optional(), // ISO date string
})
const updateSetlistSchema = createSetlistSchema.partial()
const addSongSchema = z.object({ songId: z.string() })
const updateSongSchema = z.object({
  transposeOffset: z.number().int().min(-6).max(6).optional(),
})
const reorderSchema = z.object({
  songs: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0),
  })),
})
const shareSchema = z.object({ userId: z.string() })
```

### Backend — Reorder Transaction Logic

```typescript
// Step 1: set all orders to negative (avoids unique constraint)
// Step 2: set final orders
await prisma.$transaction(async (tx) => {
  // Phase 1: temp negative orders to avoid collision
  for (let i = 0; i < songs.length; i++) {
    await tx.setlistSong.update({
      where: { id: songs[i].id },
      data: { order: -(i + 1) },
    })
  }
  // Phase 2: assign real orders
  for (let i = 0; i < songs.length; i++) {
    await tx.setlistSong.update({
      where: { id: songs[i].id },
      data: { order: songs[i].order },
    })
  }
})
```

### Backend — Access Control Pattern (inline)

```typescript
// GET /setlists — role-based WHERE filter
const where = role === 'ADMIN'
  ? {}
  : role === 'EDITOR'
    ? { OR: [{ createdById: userId }, { shares: { some: { userId } } }] }
    : { shares: { some: { userId } } } // VIEWER: only shared
```

### Frontend — Updated Types

```typescript
interface SetlistSong {
  id: string
  songId: string
  order: number
  transposeOffset: number  // NEW: -6 to +6
  song: Pick<Song, 'id' | 'title' | 'artist' | 'key'>
}

interface SetlistShare {
  id: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'email'>
}

interface Setlist {
  id: string
  name: string
  serviceDate?: string | null
  createdById: string
  songs: SetlistSong[]
  shares: SetlistShare[]  // NEW
  createdAt: string
  updatedAt: string
}
```

### Frontend — Zustand Store

```typescript
interface SetlistState {
  activeSetlistId: string | null
  currentSongIndex: number
  sessionDeltas: Record<string, number> // songId → delta

  setActive: (id: string | null) => void
  setSongIndex: (index: number) => void
  setSessionDelta: (songId: string, delta: number) => void
  resetDeltas: () => void
}

// persist config:
partialize: (state) => ({
  activeSetlistId: state.activeSetlistId,
  currentSongIndex: state.currentSongIndex,
  // sessionDeltas excluded — ephemeral by design
})
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Transpose offset math (`base + delta`) | Vitest — extend existing `useTranspose` tests |
| Unit | Reorder logic (negative temp orders) | Vitest — mock Prisma `$transaction` |
| Integration | Access control per role (ADMIN/EDITOR/VIEWER) | Supertest — 3 users, verify 200/403 per endpoint |
| Integration | Reorder with constraint validation | Supertest — reorder 5 songs, verify final order |
| E2E | Create setlist → add songs → reorder → play | Manual — tablet + desktop (Phase 4) |

## Migration / Rollout

**Single Prisma migration** (`npx prisma migrate dev --name add-setlist-features`):

1. `ALTER TABLE setlist_songs ADD COLUMN transposeOffset INTEGER NOT NULL DEFAULT 0`
2. `SetlistShare` gets `user` relation (Prisma handles the FK — column `userId` already exists, just needs the relation declaration)
3. `User` model gets `sharedSetlists SetlistShare[]` (inverse relation — no DB change)
4. Rename `Setlist.sharedWith` → `Setlist.shares` (Prisma-level only, no DB change since `@@map` stays `setlist_shares`)

**Rollback**: `npx prisma migrate reset` or revert the migration file and re-deploy.

## Open Questions

None — all blocking questions resolved:
- VIEWER access: confirmed shared-only
- transposeOffset scope: confirmed global (per SetlistSong)
- @dnd-kit: confirmed as dependency

---

## Metadata

```yaml
status: done
change: setlists
phase: design
date: 2026-03-30
```

# Tasks: Setlists

## Phase 1: Foundation

- [x] 1.1 Update `server/prisma/schema.prisma` to add `SetlistSong.transposeOffset`, fix `SetlistShare.user`, add `User.sharedSetlists`, and rename `Setlist.sharedWith` to `shares`.
- [x] 1.2 Create the Prisma migration for the additive schema changes and verify it preserves existing setlist data.
- [x] 1.3 Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` in `client/` before building the reorder UI.
- [x] 1.4 Extend `client/src/shared/types/index.ts` with `Setlist`, `SetlistSong`, and `SetlistShare` contracts, including `transposeOffset` and `shares`.

## Phase 2: Backend

- [x] 2.1 Create `server/src/routes/setlists.routes.ts` with router setup, shared Zod schemas, and inline access helpers following the songs routes pattern.
- [x] 2.2 Implement `GET /api/setlists` and `POST /api/setlists` in `server/src/routes/setlists.routes.ts` with role-based visibility and creator-only creation rules.
- [x] 2.3 Implement `GET/PUT/DELETE /api/setlists/:id` in `server/src/routes/setlists.routes.ts` with owner/admin/share checks and ordered song includes.
- [x] 2.4 Implement `POST /api/setlists/:id/songs` and `DELETE /api/setlists/:id/songs/:songId` in `server/src/routes/setlists.routes.ts`, rejecting duplicates and closing order gaps.
- [x] 2.5 Implement `PATCH /api/setlists/:id/songs/:songId` in `server/src/routes/setlists.routes.ts` for `transposeOffset` updates and optional single-song order changes with range validation.
- [x] 2.6 Implement `PUT /api/setlists/:id/songs/reorder`, `POST /api/setlists/:id/share`, and `DELETE /api/setlists/:id/share/:userId` in `server/src/routes/setlists.routes.ts`, using `$transaction` with negative temporary orders for reorder.
- [x] 2.7 Mount `setlistRoutes` in `server/src/index.ts` under `/api/setlists`.

## Phase 3: Frontend — Store + Service

- [x] 3.1 Create `client/src/features/setlists/setlists.service.ts` with typed axios methods for all setlist CRUD, song, reorder, and share endpoints.
- [x] 3.2 Create `client/src/store/setlists.store.ts` with persisted `activeSetlistId` and `currentSongIndex` using Zustand `partialize`.
- [x] 3.3 Complete `client/src/store/setlists.store.ts` actions for presentation flow: set active setlist, move song index, manage `sessionDeltas`, and reset ephemeral transposition state.

## Phase 4: Frontend — UI

- [x] 4.1 Create `client/src/features/setlists/SetlistsPage.tsx` with authorized list rendering, loading states, empty state, and navigation to detail.
- [x] 4.2 Create `client/src/features/setlists/SetlistDetailPage.tsx` with setlist metadata, ownership-aware actions, and song list rendering.
- [x] 4.3 Add reorder, transpose badges, and per-song actions inside `client/src/features/setlists/SetlistDetailPage.tsx` using `@dnd-kit` and the reorder endpoint.
- [x] 4.4 Create `client/src/features/setlists/AddSongModal.tsx` with searchable song selection and add-to-setlist submission flow.
- [x] 4.5 Create `client/src/features/setlists/ShareModal.tsx` with user selection plus share/unshare actions for owners and admins.
- [x] 4.6 Create `client/src/features/setlists/SetlistSongPage.tsx` for presentation mode, applying `finalOffset = transposeOffset + sessionDelta` and prev/next navigation.

## Phase 5: Wiring

- [x] 5.1 Update `client/src/shared/components/AppLayout.tsx` to replace the placeholder and register `/setlists`, `/setlists/:id`, and `/setlists/:id/songs/:index`.
- [x] 5.2 Update `client/vite.config.ts` to cache `/api/setlists` with Workbox `StaleWhileRevalidate`, matching the existing songs strategy.
- [x] 5.3 Verify the integrated flow against `openspec/changes/setlists/specs/setlists/spec.md`: role-filtered visibility, shared access, transpose bounds, reorder safety, and presentation mode navigation.

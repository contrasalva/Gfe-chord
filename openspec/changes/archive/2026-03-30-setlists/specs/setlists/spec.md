# Setlists Specification

## 1. Domain Overview
Setlists are collections of songs grouped together for a specific service date or event. 
- **Ownership**: Created by ADMIN or LEADER users.
- **Access Control**: Creators can manage their setlists; MEMBERS can only view setlists explicitly shared with them via `SetlistShare`. ADMINs have full visibility.
- **Musical Features**: Setlists include a global `transposeOffset` per song, allowing the leader to establish a base key for the performance. 
- **Ordering**: Songs within a setlist have a strict order, manageable via drag-and-drop on the frontend.

## 2. Data Model Additions

The Prisma schema must be updated with the following additions:

```prisma
model Setlist {
  id            String         @id @default(cuid())
  name          String
  serviceDate   DateTime?
  createdById   String
  createdBy     User           @relation(fields: [createdById], references: [id])
  songs         SetlistSong[]
  shares        SetlistShare[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model SetlistSong {
  id              String   @id @default(cuid())
  setlistId       String
  songId          String
  order           Int
  transposeOffset Int      @default(0)   // Range: -6 to +6
  setlist         Setlist  @relation(fields: [setlistId], references: [id], onDelete: Cascade)
  song            Song     @relation(fields: [songId], references: [id])
  
  @@unique([setlistId, order]) // Ensure strict ordering without collision
}

model SetlistShare {
  id        String   @id @default(cuid())
  setlistId String
  userId    String
  setlist   Setlist  @relation(fields: [setlistId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([setlistId, userId]) // A user can only have one share record per setlist
}
```

## 3. API Endpoints

### 3.1. Setlists CRUD
- `GET /api/setlists`
  - Auth: Any
  - Behavior: ADMIN sees all, LEADER sees own + shared, MEMBER sees shared only.
  - Return: `{ ok: true, data: Setlist[] }`
- `POST /api/setlists`
  - Auth: ADMIN, LEADER
  - Body: `{ name: String, serviceDate?: String }`
  - Return: 201 Created with `{ ok: true, data: Setlist }`
- `GET /api/setlists/:id`
  - Auth: Must own, be ADMIN, or have a Share.
  - Return: `{ ok: true, data: Setlist (incl. songs ordered) }`
- `PUT /api/setlists/:id`
  - Auth: Creator or ADMIN
  - Body: `{ name?: String, serviceDate?: String }`
- `DELETE /api/setlists/:id`
  - Auth: Creator or ADMIN

### 3.2. Setlist Songs Management
- `POST /api/setlists/:id/songs`
  - Body: `{ songId: String, order?: Int }` (Defaults to last order + 1)
  - Validation: Cannot add same song twice (400 Bad Request) unless explicit duplication is decided (currently rejected).
- `DELETE /api/setlists/:id/songs/:songId`
  - **Note**: `:songId` here refers to `SetlistSong.id` (the junction table PK), NOT `Song.id`.
  - Removes song, shifts subsequent orders down to prevent gaps.
- `PATCH /api/setlists/:id/songs/:songId`
  - **Note**: `:songId` here refers to `SetlistSong.id` (the junction table PK), NOT `Song.id`.
  - Body: `{ transposeOffset?: Int, order?: Int }`
  - Validation: `transposeOffset` must be between -6 and +6.
- `PUT /api/setlists/:id/songs/reorder`
  - Body: `{ songs: [{ id: String, order: Int }] }` where `id` is `SetlistSong.id` (junction table PK).
  - Logic: Must execute in a transaction, temporarily dropping/reassigning to avoid `@@unique([setlistId, order])` constraint errors.

### 3.3. Sharing
- `POST /api/setlists/:id/share/:userId`
  - Auth: Creator or ADMIN
  - `userId` is passed as a path parameter (no request body needed).
- `DELETE /api/setlists/:id/share/:userId`
  - Removes user's access.

## 4. Frontend Specs
- **State**: Use Zustand `useSetlistStore` for current setlist and player/transposition state.
- **Views**:
  - `SetlistsPage`: List available setlists (filtered by server based on role).
  - `SetlistDetailPage`: Lists songs in the setlist. If current user is Creator/ADMIN, render `@dnd-kit/sortable` handles to allow reordering.
  - `SetlistSongPage`: Presentation mode view for playing/displaying chords. Bottom navigation hidden.
- **Transposition Logic**:
  - The rendering engine applies: `finalOffset = baseOffset (from SetlistSong) + userSessionDelta (frontend only)`.

## 5. Required Scenarios & Acceptance Criteria

### Backend:
1. LEADER creates setlist → Returns 201 Created, Setlist ID returned.
2. MEMBER attempts to create setlist → Returns 403 Forbidden.
3. LEADER accesses setlist created by another LEADER (not shared) → Returns 403 Forbidden or 404 Not Found.
4. MEMBER accesses setlist shared with them → Returns 200 OK.
5. Reordering songs via `PUT /api/setlists/:id/songs/reorder` handles `@@unique` constraint securely (e.g. via negative intermediate orders or deferred constraints in SQLite if possible, or application-level recalculation transaction).
6. Adding the same song twice to a setlist → Returns 400 Bad Request (rejected by default).
7. PATCH `transposeOffset` with value > 6 or < -6 → Returns 400 Bad Request (out of range).

### Frontend:
1. `SetlistsPage` renders only the setlists the user is authorized to see.
2. `SetlistDetailPage` renders drag handles ONLY for LEADER/ADMIN who own the setlist.
3. `SetlistSongPage` activates presentation mode (hides bottom nav/distractions).
4. Transpositor component updates keys instantly using `baseOffset` + `sessionDelta`.

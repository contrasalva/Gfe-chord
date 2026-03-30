# Exploration: Setlists

**Change:** setlists  
**Phase:** explore  
**Date:** 2026-03-30  
**Status:** done

---

## Exploration: Setlists

### Current State

El sistema tiene las siguientes bases ya establecidas para setlists:

**Backend — Prisma Schema:**
- `Setlist`: id, name, serviceDate (opcional), createdById, createdAt, updatedAt. Tiene relaciones con `SetlistSong[]` y `SetlistShare[]`.
- `SetlistSong`: id, setlistId, songId, **order** (Int). Unique constraints en `[setlistId, songId]` y `[setlistId, order]`. Con `onDelete: Cascade`.
- `SetlistShare`: id, setlistId, userId, createdAt. Unique en `[setlistId, userId]`. **PROBLEMA:** no tiene relación con `User` en el schema — `userId` existe pero no hay `user User @relation(...)`. Esto romperá las queries de compartir por usuario.
- NO existe campo `transposedKey` ni `transposeOffset` en `SetlistSong` — la transposición por canción en setlist no está modelada aún.

**Backend — Rutas:**
- No existe `server/src/routes/setlists.routes.ts`. No hay ningún endpoint de setlists montado en `index.ts`.
- Patrón establecido en `songs.routes.ts`: Router de Express + Zod schemas en el mismo archivo + `authenticate` + `requireRole` + `AppError` + respuestas `{ ok: true, ...data }`.

**Frontend:**
- `SetlistsPage` es un placeholder inline en `AppLayout.tsx` (líneas 8–15), sin feature folder real.
- La ruta `/setlists` ya está en `AppLayout.tsx` y en la bottom nav.
- Tipos `Setlist` y `SetlistSong` ya están definidos en `shared/types/index.ts`.
- **NOTA:** `SetlistSong` en tipos incluye `song: Song` (eager-loaded) — coherente con lo que necesitamos.
- `idb` está instalado (`"idb": "^8.0.3"`) pero NO hay ningún archivo que lo use. Offline para setlists es trabajo pendiente.
- Workbox en `vite.config.ts` solo cachea `/api/songs` con StaleWhileRevalidate. No hay cache configurada para `/api/setlists`.

**Auth / Roles (PRD + schema):**
- Roles: `ADMIN`, `EDITOR`, `VIEWER`
- ADMIN: todo.
- EDITOR: crear/editar setlists propios. ¿Puede ver los de otros? → **Pregunta abierta en PRD** (item 2: "¿Los Viewers pueden ver TODOS los setlists, o solo los compartidos?").
- VIEWER: solo lectura.
- `requireRole` acepta strings variadic — se reutiliza idéntico.

---

### Affected Areas

**Backend:**
- `server/src/index.ts` — agregar `import setlistRoutes` y `app.use('/api/setlists', setlistRoutes)`
- `server/src/routes/setlists.routes.ts` — **crear nuevo** (no existe)
- `server/prisma/schema.prisma` — necesita migration para agregar `transposeOffset Int @default(0)` a `SetlistSong`, y corregir la relación faltante en `SetlistShare` (user relation)
- `server/prisma/migrations/` — nueva migración

**Frontend:**
- `client/src/shared/components/AppLayout.tsx` — reemplazar `SetlistsPage` placeholder con import real, agregar rutas `/setlists/:id` y `/setlists/:id/songs/:songIndex`
- `client/src/features/setlists/` — **crear feature folder completo** (no existe)
  - `SetlistsPage.tsx` — lista de setlists
  - `SetlistDetailPage.tsx` — detalle con canciones ordenadas
  - `SetlistSongPage.tsx` — canción dentro del setlist (prev/next, transpositor)
  - `setlists.service.ts` — llamadas API
  - `setlists.store.ts` — Zustand store (activo, canciones del setlist activo, índice actual)
- `client/src/shared/types/index.ts` — agregar `transposeOffset` a `SetlistSong` y revisar `SetlistShare`
- `client/vite.config.ts` — agregar runtime cache para `/api/setlists` (StaleWhileRevalidate)

---

### Approaches

#### 1. **Transposición por setlist: sin persistir (session-only)**
Igual que songs: el offset de transposición es solo estado del cliente durante la sesión. No se guarda en DB.
- **Pros:** Cero cambios al schema/migración. Simple. Consistente con el comportamiento actual de canciones.
- **Cons:** Si el líder sale y vuelve a entrar, pierde la transposición configurada por canción. Para preparar un servicio complejo, esto es molesto.
- **Effort:** Low

#### 2. **Transposición por setlist: persistida en SetlistSong (recomendada)**
Agregar `transposeOffset Int @default(0)` a `SetlistSong`. El líder puede guardar la tonalidad preferida por canción dentro del setlist.
- **Pros:** Experiencia de usuario superior para preparar servicios. El líder configura una vez y todos los músicos ven la misma transposición. Se puede exportar a PDF en v2 con la tonalidad correcta.
- **Cons:** Requiere migración DB. Endpoint PATCH adicional para actualizar offset. Lógica de merge en frontend (offset del setlist + ajuste en sesión).
- **Effort:** Medium

#### 3. **Sharing: link público (token) vs. compartir por userId**
El schema tiene `SetlistShare` con `userId` — implica compartir con usuarios específicos del sistema.  
Alternativa: token público (como InviteToken) para compartir a cualquiera con el link.
- **Opción A (userId):** más control, solo usuarios del sistema. Más alineado con "iglesia cerrada". Requiere UI de selección de usuarios.
  - **Pros:** Control preciso. Sin tokens que expiran/filtran.
  - **Cons:** Los músicos invitados (VIEWER) necesitan cuenta. No sirve para compartir a whatsapp rápido.
  - **Effort:** Medium
- **Opción B (token público):** link de solo lectura válido por tiempo limitado. Cualquiera con el link puede ver el setlist sin login.
  - **Pros:** Útil para compartir en grupo de WhatsApp de la iglesia. Cero fricción para viewers.
  - **Cons:** Requiere nuevo modelo `SetlistToken` o extend `SetlistShare`. Fuera del scope del MVP (PRD lo menciona implícitamente pero no está en requisitos checkeados).
  - **Effort:** High

#### 4. **Drag & drop para reordenar: nativo HTML5 vs. librería**
PRD especifica drag & drop para reordenar canciones en el setlist.
- **Opción A (HTML5 drag & drop nativo):** sin dependencias. Funciona en desktop. Touch en móvil es problemático.
  - **Effort:** Medium
- **Opción B (@dnd-kit/core):** librería ligera, soporta touch & mouse, accesible. Estándar moderno en React.
  - **Pros:** Touch funciona bien en móvil. Accesibilidad. API limpia.
  - **Cons:** Nueva dependencia.
  - **Effort:** Medium (misma complejidad, mejor resultado)

#### 5. **Navegación entre canciones: swipe nativo CSS vs. gestos JS**
Vista de canción dentro de setlist necesita swipe left/right en móvil.
- **Opción A (CSS scroll-snap + overflow-x):** sin JS, muy performante. Difícil combinar con transpositor que debe persistir por canción.
  - **Effort:** Low-Medium
- **Opción B (estado JS + touch events en el wrapper):** `onTouchStart`/`onTouchEnd` para detectar swipe, navegar con `useNavigate` o estado de índice. Más control.
  - **Pros:** Control total. Compatible con transpositor por canción. Ya tienen `useTranspose`.
  - **Effort:** Medium

---

### Recommendation

**Adoptar el enfoque incremental en 2 etapas dentro de Fase 3:**

**Etapa 3A — CRUD básico (MVP mínimo viable):**
- Backend: crear `setlists.routes.ts` replicando el patrón de `songs.routes.ts`.
- Schema: agregar `transposeOffset Int @default(0)` en `SetlistSong` desde el inicio (costo mínimo ahora, evita migración dolorosa después). Corregir relación faltante en `SetlistShare`.
- Frontend: crear feature `setlists/` con `SetlistsPage`, `SetlistDetailPage`, y `SetlistSongPage`.
- Transposición: persistida en `SetlistSong.transposeOffset` (Opción 2) — el offset base es del setlist, el usuario puede ajustar en sesión.
- Drag & drop: usar `@dnd-kit/core` para reordenar con soporte touch desde el inicio.
- Swipe navegación: touch events JS (Opción B) para compatibilidad con transpositor por canción.

**Etapa 3B — Compartir (defer a sprint posterior):**
- El `SetlistShare` por `userId` es suficiente para MVP: un EDITOR comparte con VIEWERs del sistema.
- El link público (token) es Fase 5/6.
- Corregir la relación faltante de `User` en `SetlistShare` en la migración de 3A.

**Decisión sobre VIEWER access:**
Basado en el PRD (pregunta abierta #2), recomendar: **VIEWER ve todos los setlists del sistema** (no requiere sharing explícito). `SetlistShare` se usa solo para notificación/favoritos futuros. Simplifica enormemente el MVP. Esta decisión DEBE confirmarse con el equipo antes de implementar.

---

### Risks

- **Relación faltante en `SetlistShare`:** El campo `userId` existe pero no hay `user User @relation(...)`. Si se hace query con `include: { user: true }` en Prisma, fallará. Debe corregirse en la migración.
- **Unique constraint `[setlistId, order]` en SetlistSong:** Al reordenar canciones con drag & drop, si se hace UPDATE individual en secuencia, puede haber colisión temporal de `order`. Solución: actualizar todos los orders en una sola transacción Prisma (`prisma.$transaction`).
- **Workbox cache para setlists:** Si se agrega cache StaleWhileRevalidate para `/api/setlists`, las mutaciones (POST/PUT/DELETE) en offline fallarán silenciosamente. Necesita `networkFirst` fallback o BackgroundSync. Para MVP se acepta "write requires online".
- **Decisión de VIEWER access sin confirmar:** Si el cliente decide que los setlists son privados hasta que se compartan explícitamente, el schema de `SetlistShare` pasa a ser CRÍTICO para el flujo y no defer-able.
- **`@dnd-kit`:** nueva dependencia. Si el proyecto tiene restricción de deps, usar HTML5 DnD con limitación en touch (users móvil no podrán reordenar).
- **`idb` no está usado aún:** Para offline de setlists se necesitará implementar un `setlists.store.idb.ts` (similar al patrón de caching manual). Esto es Fase 5, pero el diseño del Zustand store debe ser consciente de ello (no meter lógica de sync en el store de UI).

---

### Open Questions (requieren decisión)

1. **¿VIEWER ve TODOS los setlists o solo los compartidos explícitamente?** → Impacta si `SetlistShare` es obligatorio o decorativo en MVP.
2. **¿El transposeOffset se guarda por setlist (para todos) o por usuario+setlist?** → Si cada músico quiere su propia transposición, necesitamos `UserSetlistSongPreference` — mucho más complejo.
3. **¿Se puede confirmar que la restricción "EDITOR edita solo sus setlists" aplica igual que en canciones?** → El PRD dice "setlists propios" para EDITOR.

---

### Ready for Proposal

Yes — La exploración está completa. El esquema de datos tiene las bases pero requiere correcciones (relación User en SetlistShare) y una adición menor (transposeOffset en SetlistSong). Los patrones backend y frontend están 100% establecidos y se replican directamente. Las decisiones clave antes de proponer:
1. Confirmar VIEWER access policy (todos vs. solo compartidos).
2. Confirmar si transposeOffset es global (por setlist) o personal (por usuario × setlist) — recomendamos global para MVP.
3. Aceptar `@dnd-kit` como nueva dependencia.

---

## Metadata

```yaml
status: done
executive_summary: >
  El feature de setlists tiene el schema de datos casi completo en Prisma (falta relación User
  en SetlistShare y campo transposeOffset en SetlistSong), cero endpoints en el backend, y un
  placeholder de UI en el frontend. Todos los patrones de arquitectura están establecidos y son
  directamente replicables. El riesgo principal es una decisión de negocio no definida: si los
  VIEWERs ven todos los setlists o solo los compartidos explícitamente.
next_recommended: propose
skill_resolution: injected
```

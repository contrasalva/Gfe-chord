# PRD — GFE Chord
## Cancionero Digital para Iglesia (PWA)

**Versión:** 1.0  
**Fecha:** 2026-03-29  
**Estado:** En definición

---

## 1. Contexto y Problema

La iglesia GFE necesita un cancionero digital accesible desde cualquier dispositivo (tablet, móvil, desktop) sin invertir en el desarrollo de una aplicación nativa. Los músicos y líderes de alabanza necesitan acceder a letras y acordes de canciones durante los ensayos y servicios, con la capacidad de organizar repertorios por servicio.

**Aplicación de referencia:** JustChords — se toma como guía funcional, pero se mejora en diseño, modernidad y foco en el contexto de iglesia.

---

## 2. Solución

**Progressive Web App (PWA)** — Una sola codebase que funciona en todos los dispositivos, instalable desde el navegador, funcional sin conexión a internet (Service Worker + cache offline), sin costo de distribución en tiendas de aplicaciones.

### ¿Por qué PWA y no app nativa?

| Criterio | PWA | App Nativa |
|---|---|---|
| Costo de desarrollo | ✅ Una sola codebase | ❌ iOS + Android por separado |
| Distribución | ✅ Sin App Store | ❌ Requiere cuentas de desarrollador |
| Offline | ✅ Service Worker | ✅ Nativo |
| Instalable en home screen | ✅ Sí | ✅ Sí |
| Actualizaciones | ✅ Inmediatas | ❌ Requiere aprobación de tienda |
| Recursos necesarios | ✅ Mínimos | ❌ Altos |

---

## 3. Usuarios y Roles

### 3.1 Roles del Sistema

| Rol | Descripción | Permisos |
|---|---|---|
| **Admin** | Administrador de la iglesia | Todo: CRUD canciones, CRUD setlists, gestión de usuarios |
| **Editor** | Músico / Líder de alabanza | Crear/editar canciones, crear/editar setlists propios |
| **Viewer** | Miembro de la congregación / músico invitado | Solo lectura: ver canciones y setlists |

### 3.2 Flujo de Acceso

- Autenticación requerida para todos los roles
- Registro solo por invitación (un Admin crea la cuenta o genera un link de invitación)
- No hay registro público — el contenido es exclusivo de esta iglesia
- JWT para sesiones con refresh token
- Soporte de "recordarme" (30 días)

---

## 4. Funcionalidades

### 4.1 MVP (Versión 1)

#### Autenticación
- [x] Login con email + contraseña
- [x] "Recordarme" (sesión persistente 30 días)
- [x] Recuperación de contraseña por email
- [x] Gestión de perfil básico (nombre, foto, cambio de contraseña)

#### Biblioteca de Canciones
- [x] Listado de canciones con búsqueda (por título, artista, tonalidad, tag)
- [x] Vista de canción: letra con acordes posicionados encima de cada sílaba
- [x] Filtros: por artista, por tag/categoría, por tonalidad
- [x] Ordenamiento: alfabético, por más recientes, por más usados
- [x] Tags/categorías personalizables (ej. "Adoración", "Alabanza", "Ofertorio")

#### Gestión de Canciones (Admin + Editor)
- [x] Crear canción: título, artista, letra con acordes, tonalidad, capo, BPM, compás
- [x] Editar canción
- [x] Eliminar canción (con confirmación) — Admin únicamente
- [x] Formato de acordes sobre letra (chord-above-lyrics format)
- [x] Secciones de canción: Intro, Verso, Pre-Coro, Coro, Puente, Outro

#### Transpositor
- [x] Transposición en tiempo real (± semitonos desde la tonalidad base)
- [x] El transpositor es por sesión — no altera la canción guardada
- [x] Indicador de capo equivalente al transponer

#### Setlists / Repertorios
- [x] Crear setlist con nombre y fecha de servicio
- [x] Agregar/quitar/reordenar canciones en el setlist (drag & drop)
- [x] Navegar entre canciones del setlist con swipe (móvil) o flechas (desktop)
- [x] Indicador "siguiente canción" visible en la vista de canción cuando estás en un setlist

#### Gestión de Usuarios (Admin)
- [x] Listar usuarios registrados
- [x] Cambiar rol de un usuario (Admin → Editor → Viewer)
- [x] Desactivar/activar cuenta de usuario
- [x] Generar link de invitación con rol predeterminado

#### PWA / Offline
- [x] Instalable en pantalla de inicio (manifest.json)
- [x] Service Worker con estrategia cache-first para canciones ya visitadas
- [x] Funcionamiento completo offline para canciones cacheadas
- [x] Sincronización automática al reconectarse

### 4.2 Versión 2 (Post-MVP)

- [ ] Diagramas de acordes (fretboard visual, como en JustChords)
- [ ] Modo autoscroll (scroll automático mientras tocan)
- [ ] Historial de canciones recientes
- [ ] Favoritos por usuario
- [ ] Exportar setlist a PDF
- [ ] Importar canción desde ChordPro format
- [ ] Metrónomo integrado

---

## 5. Diseño y UX

### 5.1 Paleta de Colores

```
Primary (Vino/Mauve):   #754456  — Elementos primarios, CTA principal
Light (Gris claro):     #E0E1E3  — Fondos secundarios, superficie
Dark (Casi negro):      #1F211F  — Fondo principal dark mode, texto
Mid (Gris medio):       #B1B3B1  — Texto secundario, bordes, separadores  
Accent (Índigo/Azul):   #515486  — Acordes, links, elementos interactivos
```

**Uso de color en acordes:** Los acordes se muestran siempre en `#515486` (Accent Índigo) para mantener la convención conocida de JustChords pero con un tono más sofisticado y más cálido que el azul eléctrico.

### 5.2 Tipografía

| Uso | Fuente | Peso |
|---|---|---|
| Títulos / Headings | Poppins | 600, 700 |
| Cuerpo / Letras | Inter | 400, 500 |
| Acordes | Inter Mono / JetBrains Mono | 500 |

**Decisión:** Fuente monospace para acordes — garantiza que el posicionamiento espacial de acordes sobre sílabas sea preciso y consistente en todos los dispositivos.

### 5.3 Layout por Dispositivo

#### Mobile (< 768px)
- Sin sidebar visible
- Bottom navigation bar (4 íconos: Canciones, Setlists, Buscar, Perfil)
- Vista de canción ocupa el 100% del viewport
- Swipe left/right para navegar entre canciones del setlist
- Transpositor accesible desde botón flotante (FAB)

#### Tablet (768px - 1024px)
- Sidebar colapsable a la izquierda (estilo JustChords)
- Lista de canciones + vista de canción en split view
- Sidebar muestra lista, contenido a la derecha
- Gestos de swipe para colapsar/expandir sidebar

#### Desktop (> 1024px)
- Layout de 3 columnas: navegación | lista | contenido
- Sidebar fijo con navegación principal
- Panel central con lista de canciones scrolleable
- Panel derecho con vista de canción

### 5.4 Vistas / Pantallas

| Pantalla | Descripción |
|---|---|
| **Login** | Email + contraseña, "recordarme", link a recuperación |
| **Library** | Lista de todas las canciones con buscador y filtros |
| **Song Detail** | Título, artista, acordes + letra por sección, transpositor |
| **Setlists** | Lista de setlists, indicador de fecha y cantidad de canciones |
| **Setlist Detail** | Lista ordenada de canciones del setlist, navegación |
| **Song in Setlist** | Vista de canción con navegación prev/next dentro del setlist |
| **Create/Edit Song** | Formulario de creación/edición con editor de acordes |
| **Users (Admin)** | Lista de usuarios, cambio de rol, invitaciones |
| **Profile** | Nombre, foto, cambio de contraseña |

### 5.5 Principios de UX

1. **Legibilidad primero** — La vista de canción es el corazón de la app. Tamaño de fuente mínimo 16px para letra, acordes distinguibles visualmente.
2. **Cero distracciones en servicio** — En vista de canción, la UI desaparece; solo letra y acordes.
3. **Mobile-first** — Diseñar para móvil primero, luego escalar a tablet y desktop.
4. **Touch targets de 44px mínimo** — Botones accesibles con el dedo durante un servicio.
5. **Feedback inmediato** — Transpositor responde instantáneamente, sin delay.
6. **Offline always works** — Si la canción fue vista antes, siempre está disponible.

---

## 6. Arquitectura Técnica

### 6.1 Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Estado Global | Zustand |
| Routing | React Router v7 |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Node.js + Express + TypeScript |
| Base de Datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | JWT + Refresh Token (httpOnly cookie) |
| API | REST |

### 6.2 Estructura del Proyecto

```
gfe-chord/
├── client/                    # React PWA
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── songs/
│   │   │   ├── setlists/
│   │   │   └── users/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── ...
│   └── public/
│       └── manifest.json
└── server/                    # Express API
    ├── src/
    │   ├── routes/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── services/
    │   └── prisma/
    └── ...
```

### 6.3 Modelo de Datos (Entidades Principales)

```
User
  id, email, name, passwordHash, role (ADMIN|EDITOR|VIEWER), 
  isActive, avatarUrl, createdAt

Song
  id, title, artist, key (tonalidad), capo, bpm, timeSignature,
  content (chord-pro format), tags[], createdBy, updatedAt

Setlist
  id, name, serviceDate, createdBy, songs[] (ordenados), createdAt

SetlistSong
  setlistId, songId, order (posición)

InviteToken
  id, email, role, token, expiresAt, usedAt
```

### 6.4 Formato de Contenido de Canciones

Se usará un formato inspirado en **ChordPro** simplificado:

```
[Verso 1]
[C]Jesus, [Cmaj7]Jesus, [C7]Jesus
There's just [F]something a[Fm]bout that [C]name
```

Los acordes van entre corchetes `[Acorde]` inline en el texto. El renderer los extrae y los posiciona encima de la sílaba correspondiente.

### 6.5 Service Worker Strategy

| Recurso | Estrategia |
|---|---|
| Assets estáticos (JS/CSS/fonts) | Cache First |
| API de canciones (GET) | Stale While Revalidate |
| API de escritura (POST/PUT/DELETE) | Network First (falla con mensaje offline) |
| Imágenes | Cache First con expiración 30 días |

---

## 7. Seguridad

- JWT con expiración de 15 minutos + Refresh Token en httpOnly cookie (7 días)
- Rate limiting en rutas de autenticación (máximo 5 intentos / 15 min por IP)
- Validación de input en servidor con Zod
- Roles verificados en cada endpoint del servidor (no solo en el frontend)
- Contraseñas hasheadas con bcrypt (cost factor 12)
- CORS configurado solo para el dominio de la app

---

## 8. Preguntas Abiertas

Estas preguntas requieren decisión antes de empezar el desarrollo:

| # | Pregunta | Impacto |
|---|---|---|
| 1 | ¿Los Editors pueden editar canciones creadas por otros Editors, o solo las propias? | Modelo de datos + lógica de permisos |
| 2 | ¿Los Viewers pueden ver TODOS los setlists, o solo los que un Editor/Admin les comparte? | Modelo de datos de setlists |
| 3 | ¿Se necesita multilenguaje (español/inglés) en la interfaz, o solo español? | i18n setup |
| 4 | ¿Existe un dominio ya definido donde se va a hospedar? | Configuración de CORS y manifest |
| 5 | ¿Se necesita subir audio/backing track junto a las canciones (V2 posible)? | Storage (S3 o similar) |

---

## 9. Métricas de Éxito

- Tiempo de carga inicial < 3 segundos en 4G
- Funciona 100% offline para canciones previamente visitadas
- La app se puede instalar en iOS Safari, Android Chrome y desktop Chrome
- Lighthouse PWA score > 90
- Lighthouse Accessibility score > 90

---

## 10. Fases de Desarrollo

### Fase 1 — Fundación (Setup + Auth)
- Configuración de monorepo (client + server)
- Setup PWA con Vite
- Autenticación completa (login, JWT, refresh, roles)
- Layout base responsive (mobile/tablet/desktop)

### Fase 2 — Core (Canciones)
- CRUD de canciones
- Renderer de acordes + letra
- Transpositor en tiempo real
- Búsqueda y filtros

### Fase 3 — Setlists
- CRUD de setlists
- Navegación entre canciones del setlist
- Indicador "siguiente canción"

### Fase 4 — Usuarios y Roles
- Gestión de usuarios (Admin)
- Sistema de invitaciones
- Permisos por rol en frontend y backend

### Fase 5 — PWA y Offline
- Service Worker con estrategias de cache
- Soporte offline completo
- Manifest y metadatos de instalación

### Fase 6 — Pulido y QA
- Pruebas en dispositivos reales (iOS Safari, Android Chrome)
- Lighthouse audit y correcciones
- Accesibilidad (WCAG AA mínimo)
- Ajustes de UX post-testing

---

*Documento vivo — se actualiza con cada decisión tomada durante el desarrollo.*

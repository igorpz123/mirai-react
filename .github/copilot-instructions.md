# Copilot Instructions: Mirai React

## Architecture Overview
This is a **full-stack TypeScript monorepo** with React (Vite) frontend and Express backend in `server/`. The app uses **Socket.IO for realtime presence & notifications**, JWT auth, and MySQL (via `mysql2/promise`). Production builds run both frontend and backend in a single Node process when `SERVE_FRONT=true`.

### Key Directory Structure
- **`src/`**: React frontend with Vite, Tailwind v4, Radix UI, React Router v7
- **`server/`**: Express backend with separate `package.json` and `tsconfig.json`
  - `server/server.ts`: main entrypoint (HTTP + Socket.IO server)
  - `server/routes/router.ts`: aggregates all API routes under `/api`
  - `server/config/`: `auth.ts` (JWT), `db.ts` (MySQL pool with dateStrings mode)
  - `server/middleware/upload.ts`: Multer disk storage under `uploads/task-<id>/`, `uploads/proposal-<id>/`, `uploads/user-<id>/`
  - `server/services/`: business logic for auth, notifications, auto-tasks, changelog
  - `server/controllers/`: REST handlers (Auth, User, Task, Proposal, Notification, etc.)

### Build & Dev Workflows
```bash
# Root level
npm run dev                    # Vite dev server on :5173, proxies /api → :5000
npm run build                  # TypeScript check + Vite build → dist/
npm run build:server           # Compile server → server/dist/
npm run build:full             # Build both frontend and server
npm run install:all            # Install deps for root + server/

# Server level (in server/ directory)
npm run dev                    # ts-node-dev server.ts (live reload)
npm run build                  # tsc → dist/
npm run start                  # node dist/server.js
```

**Production:** Server can serve frontend build when `SERVE_FRONT=true` and `FRONT_DIST_PATH=<path>` (defaults to `../dist`). Health check at `/api/health`.

## Authentication & Authorization
- **JWT tokens** signed with `JWT_SECRET` (see `server/config/auth.ts`)
- Frontend decodes token in `AuthContext` to populate `user` object with `{id, email, nome, sobrenome, cargoId, cargo, fotoUrl, unidades[], setores[]}`
- Role-based routing in `App.tsx`: `cargoId` 1/2/3 → admin dashboards, 13 → commercial dashboard, others → technical dashboard
- Protected routes use `<ProtectedRoute>`, `<AdminRoute>`, and `<AdminOrSelfRoute>` wrappers
- Session expiry: `AuthContext` monitors JWT `exp` claim and shows renewal modal 2min before expiry

## Realtime Features (Socket.IO)
**Two overlapping presence systems exist for historical reasons:**
1. **`PresenceContext`** (legacy, still used in some components)
2. **`RealtimeContext`** (newer, also handles notifications)

Both connect to the same Socket.IO server in `server/server.ts`. The server maintains in-memory presence (`Map<userId, { lastPing, online }>`), broadcasts `presence:update` events, and falls back to `last_seen` column in `usuarios` table via HTTP `/api/presenca/ping`.

### Socket.IO Event Flow
- **Client → Server:**
  - `auth:init { token }` on connection → server joins socket to `user:<userId>` room, updates `last_seen`, marks user online
  - `presence:ping` every 10s → updates in-memory presence + DB `last_seen`
- **Server → Client:**
  - `presence:snapshot { users: number[] }` on connect → initial list of online users
  - `presence:update { userId, state: 'online'|'offline' }` → realtime presence changes
  - `notification:new <NotificationRecord>` → pushed to user's personal room when backend calls `notificationService.createNotification()`

### Notification System
- **Backend:** `server/services/notificationService.ts` manages `notifications` table (schema: `user_id`, `actor_id`, `type`, `title`, `body`, `entity_type`, `entity_id`, `metadata`, `delivered_at`, `read_at`)
- **Frontend:** `RealtimeContext` listens to `notification:new`, updates local state, and shows toast via `toastNotification()` from `src/lib/customToast.tsx` (uses Sonner library with custom styled toasts)
- **API endpoints:** `GET /api/notificacoes`, `POST /api/notificacoes/:id/read`, `POST /api/notificacoes/read-all`

## Database Conventions
- **MySQL via `mysql2/promise`** pool in `server/config/db.ts`
- **`dateStrings: true`** to avoid timezone shifts—dates returned as `"YYYY-MM-DD HH:mm:ss"` strings
- **`decimalNumbers: true`** to parse DECIMAL as JS numbers
- Controllers extract `userId` from JWT by decoding `Authorization: Bearer <token>` header
- No ORM—raw SQL queries with parameterized placeholders

## Frontend Patterns
- **Path alias:** `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`)
- **Context providers** wrap `App` in `main.tsx`: `ThemeProvider` → `AuthProvider` → `UnitProvider` → `UsersProvider` → `RealtimeProvider`
- **Routing:** React Router v7 with nested routes under `<Layout>` (sidebar navigation)
- **UI library:** Radix UI primitives + Tailwind CSS v4 (via `@tailwindcss/vite` plugin), custom components in `src/components/ui/`
- **Forms:** React Hook Form + Zod for validation
- **Charts:** Recharts for dashboards
- **Icons:** `@tabler/icons-react` and Lucide React
- **Toasts:** Sonner with custom styled wrappers in `customToast.tsx` (`toastSuccess`, `toastError`, `toastWarning`, `toastNotification`)

## File Upload Conventions
- **Multer** middleware in `server/middleware/upload.ts` saves files to `server/uploads/<entity>-<id>/` with timestamped filenames
- Exposed at `/uploads/*` prefix (served as static files in `server.ts`)
- Three upload instances: `uploadTarefa`, `uploadProposta`, `uploadUser` (configured per-entity)

## Code Style & Conventions
- **TypeScript strict mode** enabled (`tsconfig.json`)
- **ESLint v9** flat config (`eslint.config.js`) with TypeScript ESLint rules
- **Async/await** for all DB and HTTP operations
- **Error handling:** Try/catch blocks log errors to console, return 500 with generic messages in production
- **Naming:** Backend uses snake_case for DB columns, frontend uses camelCase (mapping happens in services/controllers)
- **Environment variables:** `.env` files for `JWT_SECRET`, `MYSQL_*`, `PORT`, `SERVE_FRONT`, `VITE_API_WS_URL` (frontend), etc.

## Testing & Debugging
- **No test suite currently configured** (tests are aspirational, not implemented)
- **Dev mode:** Run `npm run dev` (frontend) and `npm --prefix server run dev` (backend) in separate terminals
- **Logs:** Server logs to stdout, check terminal for SQL errors, JWT verification failures, Socket.IO connection issues
- **Common pitfall:** Frontend in dev proxies `/api` and `/uploads` to `localhost:5000` (see `vite.config.ts`); ensure backend is running on port 5000

## Deployment Notes
- **PowerShell scripts** in `scripts/` for Lightsail deployment (`deploy-all.ps1`, `deploy-backend.ps1`, `deploy-frontend.ps1`)
- See `DEPLOY_LIGHTSAIL.md` for production setup instructions
- Backend serves compiled frontend when `SERVE_FRONT=true` (SPA fallback for client-side routing)

## When Adding Features
1. **New API endpoint:** Add route in `server/routes/`, controller in `server/controllers/`, service logic in `server/services/`
2. **New React page:** Create in `src/pages/`, add route in `App.tsx`, import in `Layout` sidebar if needed
3. **New realtime event:** Emit from backend via `getIO().to('user:<userId>').emit(...)`, listen in `RealtimeContext` or `PresenceContext`
4. **New DB table:** Update schema manually (no migrations framework), adjust `server/config/db.ts` if needed
5. **New notification type:** Call `createNotification()` in backend service, frontend will auto-receive via Socket.IO

## Important Files to Reference
- **Authentication flow:** `server/services/authService.ts`, `src/contexts/AuthContext.tsx`
- **Realtime architecture:** `server/server.ts` (Socket.IO setup), `src/contexts/RealtimeContext.tsx`
- **Role-based access:** `src/constants/roles.ts`, `src/components/auth/AdminRoute.tsx`
- **API aggregation:** `server/routes/router.ts` (all `/api/*` routes)
- **Database config:** `server/config/db.ts` (connection pool, dateStrings mode)

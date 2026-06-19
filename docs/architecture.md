# ClutchQ Architecture

ClutchQ is a MERN application split into a Vite React client and an Express/Mongoose API.

## Client

- `src/services/api.js` owns Axios configuration and JWT bearer injection.
- `src/context/AuthContext.jsx` owns session persistence, profile save, demo login, and logout.
- `src/context/ToastContext.jsx` owns lightweight app feedback.
- `src/components/*` contains custom UI only. No external UI component library is used.
- `src/pages/*` maps directly to product routes.

## Server

- `server.js` configures CORS, JSON parsing, health checks, and route mounts.
- `models/` defines User, GamerProfile, Lobby, Request, Review, Report, and Session schemas.
- `controllers/` enforces route behavior and ownership checks.
- `middleware/` provides auth, admin-only access, async handling, and consistent errors.
- `utils/` contains the matchmaking, chemistry, availability, trust, rank, token, badge, and seed helpers.

## Data Flow

1. User authenticates through `/api/auth`.
2. User creates a profile through `/api/profiles/me`.
3. Dashboard calls `/api/matchmaking/recommendations`.
4. API returns scores plus explanations.
5. React renders score rings, breakdown rows, warnings, heatmaps, and charts.
6. Requests, reviews, lobbies, reports, and sessions update trust and admin analytics.

## Security

- Passwords are hashed with bcryptjs.
- JWT protects all app routes after login.
- Admin endpoints require both auth and `role === "admin"`.
- Suspended users cannot authenticate.
- Lobby request decisions require lobby owner or request recipient permissions.

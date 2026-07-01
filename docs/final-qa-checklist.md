# Final QA Checklist

Use this checklist before a demo, redeploy, or judging run.

## Local Build

```powershell
npm run build
```

Expected result: Vite completes successfully and writes `client/dist`.

## Local Run

```powershell
npm run dev
```

Open:

```txt
http://localhost:5173
```

Confirm the backend health endpoint works:

```txt
http://localhost:5000/api/health
```

## Auth

- Demo login works with `demo@clutchq.com / demo123`.
- Email registration creates a new account without a network error.
- New email accounts show the verification banner after register/login.
- Get OTP requires Turnstile in production and uses the dev fallback only outside production.
- OTP email sends through SMTP in production or logs `DEV OTP` locally.
- Wrong OTP fails with a clean message.
- Repeated wrong OTP attempts are denied.
- Correct OTP marks the user as verified and cannot be reused.
- Forgot password returns the generic OTP message without revealing whether an email exists.
- Reset password works with a valid password reset OTP.
- Login with the new password works and failed login messages stay generic.
- Google, Discord, and Steam buttons redirect back to the frontend, not to a blank backend page.
- Logging out clears the session and protected pages return to login.

## Profile

- Profile opens from the top-right account menu.
- Steam sync does not show demo data after a real Steam account is connected.
- Avatar upload accepts PNG, JPG, and WebP under 500KB.
- Empty Steam friends, achievements, or library panels show a clear empty state.
- Gameplay Graph loads without `NaN`, `undefined`, or raw JSON.
- Situational strengths and teammate edges stay compact and do not clutter the profile.

## Gameplay Intelligence

Worker smoke test:

```powershell
Get-Content -Raw analytics-worker/sample_inputs/session_bundle.json | python analytics-worker/main.py
```

Confirm:

- `/api/intelligence/health` returns Python status and fallback availability.
- Activity rhythm loads from `/api/intelligence/rhythm/me`.
- Ending a session opens Match Wrap-Up without blocking the session stop.
- Scorecard upload accepts PNG, JPG, and WebP, then compresses below 900KB.
- Manual stats can be submitted without an image.
- Teammate feedback can be skipped or submitted.
- ScorecardAnalysis and GameplayGraph records update after analysis.
- Python unavailable simulation returns lightweight fallback analysis, not a server crash.
- A brand new account with no data shows calm empty states.
- Scorecard payloads above 900KB are rejected by the controller.
- Unsupported image MIME types and SVG data URLs are rejected.
- Feedback ratings outside 1-5 are rejected with a clean message.

## Games And Rooms

- `/games` loads the game grid and filters without layout overflow.
- Empty search results show a friendly empty state.
- Room cards disable joining when the room is full, cancelled, or a preview room.
- Creating a room trims long titles and caps members to the supported range.
- A full room changes to full state after the last slot is taken.

## External Game Metadata

- `GET /api/external/games/search?q=valorant` returns cached/external metadata or an empty safe response.
- `GET /api/external/games/valorant/metadata` returns catalog fallback even when no external cache exists.
- `POST /api/external/games/sync` requires admin auth.
- If `RAWG_API_KEY` is blank or external APIs fail, `/games` still loads from the catalog.
- Cached metadata improves posters/covers but does not clutter game pages.

## Lobbies

- Creating a lobby starts from profile defaults but requires a real title.
- Join requests cannot be sent to full or closed lobbies.
- A lobby owner cannot accept a request after the lobby is full.
- Resolved requests cannot be accepted/rejected/cancelled again.

## Discord Voice

Required backend env values:

```env
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_CATEGORY_ID=
STEAM_API_KEY=
PYTHON_BIN=python
TURNSTILE_SECRET_KEY=
OTP_EMAIL_FROM=ClutchQ <no-reply@example.com>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
STEAM_REALM=https://clutchq-backend.onrender.com
STEAM_CALLBACK_URL=https://clutchq-backend.onrender.com/api/auth/steam/callback
```

Confirm:

- `/api/discord/health` reports the bot, guild, category, and permissions.
- Lobby owner can create a voice room.
- Accepted members can view/join/copy the invite.
- Non-members cannot see the invite URL.
- Creating again reuses the existing room.

## Deployment Env

Render backend:

```env
NODE_ENV=production
PORT=10000
MONGO_URI=
JWT_SECRET=
CLIENT_URL=https://clutch-q.vercel.app
SERVER_URL=https://clutchq-backend.onrender.com
ALLOWED_ORIGINS=https://clutch-q.vercel.app
```

Vercel frontend:

```env
VITE_API_URL=https://clutchq-backend.onrender.com/api
VITE_PRODUCTION_API_URL=https://clutchq-backend.onrender.com/api
VITE_LOCAL_API_URL=http://localhost:5000/api
VITE_TURNSTILE_SITE_KEY=
```

Never commit real `.env` files or provider secrets.

Optional external metadata:

```env
RAWG_API_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
```

## Optional MCP

- Normal app usage works without MCP.
- `docs/mcp-plan.md` clearly marks MCP as dev/admin optional.
- No production route requires MCP.

## Secret Scan

Before pushing, scan changed files for:

```txt
STEAM_API_KEY
DISCORD_BOT_TOKEN
GOOGLE_CLIENT_SECRET
DISCORD_CLIENT_SECRET
JWT_SECRET
MONGO_URI
mongodb+srv
RAWG_API_KEY
IGDB_CLIENT_SECRET
CLUTCHQ_MCP_TOKEN
TURNSTILE_SECRET_KEY
SMTP_PASS
SMTP_USER
sk-
xoxb
123456
```

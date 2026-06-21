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
- Google, Discord, and Steam buttons redirect back to the frontend, not to a blank backend page.
- Logging out clears the session and protected pages return to login.

## Profile

- Profile opens from the top-right account menu.
- Steam sync does not show demo data after a real Steam account is connected.
- Avatar upload accepts PNG, JPG, and WebP under 500KB.
- Empty Steam friends, achievements, or library panels show a clear empty state.

## Games And Rooms

- `/games` loads the game grid and filters without layout overflow.
- Empty search results show a friendly empty state.
- Room cards disable joining when the room is full, cancelled, or a preview room.
- Creating a room trims long titles and caps members to the supported range.
- A full room changes to full state after the last slot is taken.

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
```

Never commit real `.env` files or provider secrets.

# ClutchQ Setup

## What You Need To Provide

You only need one database option:

1. Start local MongoDB on `mongodb://127.0.0.1:27017/clutchq`
2. Or start Docker Desktop and run MongoDB with Docker Compose
3. Or provide a MongoDB Atlas URI and paste it into `server/.env`

Everything else is already installed in this workspace.

## Fastest Local Path

Open PowerShell:

```powershell
cd C:\Users\abhij\OneDrive\Desktop\ClutchQ\ClutchQ
```

Start Docker Desktop manually, wait until it says Docker is running, then:

```powershell
docker compose up -d mongo
npm run seed
npm run dev
```

Open:

```txt
http://localhost:5173
```

Use:

```txt
Demo: demo@clutchq.com / demo123
Admin: admin@clutchq.com / admin123
```

## Atlas Path

If you use MongoDB Atlas, replace this line in `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/clutchq
```

with your Atlas URI:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/clutchq
```

Then run:

```powershell
npm run seed
npm run dev
```

## Discord Voice Room Setup

To create lobby voice rooms, `server/.env` must include:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_server_id
DISCORD_CATEGORY_ID=1517824708668817499
```

The bot must be installed in that Discord server with Manage Channels, Create Invite, View Channels, Connect, and Speak permissions.

## Steam Setup

Steam login and sync use server-only env values. Put these in `server/.env` locally or Render environment variables in production:

```env
STEAM_API_KEY=your_steam_web_api_key
STEAM_REALM=http://localhost:5000
STEAM_CALLBACK_URL=http://localhost:5000/api/auth/steam/callback
```

For Render:

```env
STEAM_REALM=https://clutchq-backend.onrender.com
STEAM_CALLBACK_URL=https://clutchq-backend.onrender.com/api/auth/steam/callback
```

Do not put `STEAM_API_KEY` in `client/.env` or Vercel. Steam library, friends, achievements, and recent activity depend on the connected Steam account privacy settings. Set Steam Profile and Game Details to Public, then sync again.

## Check Commands

Client `.env` should keep the localhost fallback while still supporting deployed builds:

```env
VITE_API_URL=http://localhost:5000/api
VITE_LOCAL_API_URL=http://localhost:5000/api
VITE_PRODUCTION_API_URL=https://clutchq-backend.onrender.com/api
```

Frontend build:

```powershell
cd client
npm run build
```

Backend health after `npm run dev`:

```txt
http://localhost:5000/api/health
```

## If Something Fails

- `MongoDB connection failed`: your database is not running or `MONGO_URI` is wrong.
- `docker compose` fails: start Docker Desktop first.
- Demo login missing: run `npm run seed`.
- Frontend API errors: confirm backend is running on `http://localhost:5000`.

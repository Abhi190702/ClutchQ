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

## Check Commands

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

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
$env:NODE_ENV='development'
npm run seed
npm run seed:demo
npm run seed:games
npm run dev
```

Open:

```txt
http://localhost:5173
```

Use:

```txt
Abhijeet: demo@clutchq.com / demo123
CaptainRex: captain@clutchq.com / demo123
NovaSentinel: sentinel@clutchq.com / demo123
FlexByte: flex@clutchq.com / demo123
Admin: admin@clutchq.com / admin123
```

If your local `server/.env` has `NODE_ENV=production` for Render, keep the PowerShell override above while seeding locally so the seed uses your local MongoDB instead of Atlas.

## Safe Demo Account Seed

If the deployed site says `Invalid email or password` for `captain@clutchq.com`, `sentinel@clutchq.com`, or `flex@clutchq.com`, the production Atlas database has not received the demo-only seed yet.

Safe production method:

```powershell
$env:NODE_ENV='production'
npm run seed:demo
```

This does not wipe the database. It upserts the four demo users and refreshes demo-only lobbies, requests, activity, and Steam-like data. Run it only when `MONGO_URI` points to the Atlas database used by your Render backend.

Production seeding warning: `seed:demo` is safe for demo accounts, but it still writes to the live database configured by `MONGO_URI`. Confirm the Render/Atlas database first.

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

## Email OTP, Turnstile, And SMTP

Local development can run without real Turnstile or SMTP. If `TURNSTILE_SECRET_KEY` is blank and `NODE_ENV` is not production, the frontend shows a development security fallback and the backend allows the OTP request. If SMTP is blank in development, the OTP is printed in the server console.

Backend `server/.env` or Render:

```env
TURNSTILE_SECRET_KEY=
TURNSTILE_ALLOWED_HOSTNAMES=clutch-q.vercel.app
OTP_EMAIL_FROM=ClutchQ <no-reply@example.com>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
OTP_TTL_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5
```

Frontend `client/.env` or Vercel:

```env
VITE_TURNSTILE_SITE_KEY=
```

Production rules:

- Add `TURNSTILE_SECRET_KEY` to Render and `VITE_TURNSTILE_SITE_KEY` to Vercel from the same Cloudflare Turnstile widget.
- `TURNSTILE_ALLOWED_HOSTNAMES` is optional and defaults to the hostname in `CLIENT_URL`. It also accepts an HTTPS origin such as `https://clutch-q.vercel.app/`.
- Add SMTP values to Render before testing live OTP email.
- Redeploy both backend and frontend after changing these values.
- Do not put SMTP or Turnstile secret keys in Vercel.

Test Brevo SMTP without touching OTP state:

```powershell
cd server
npm run test:email -- your-email@example.com
```

Expected result:

```txt
Test email sent successfully.
```

Password reset UX is intentionally three steps:

1. Email and Turnstile sends an OTP.
2. OTP-only screen verifies the code.
3. New password fields appear only after the code is verified.

## Gameplay Intelligence Worker

Python is optional but recommended for the richer scorecard, rhythm, teammate fit, and Gameplay Graph analysis. The app never exposes Python as a second backend; the Express server launches it as an internal worker and falls back safely if Python is missing.

Add this to `server/.env` locally or Render if Python is available:

```env
PYTHON_BIN=python
```

If your machine uses `python3`, set:

```env
PYTHON_BIN=python3
```

Smoke test from the project root:

```powershell
Get-Content -Raw analytics-worker/sample_inputs/session_bundle.json | python analytics-worker/main.py
```

Expected result: one JSON object with `success: true`, `task: "build_rhythm"`, and a `data.summary`. On Render or local machines without Python, `/api/intelligence/health` will report Python unavailable and the server will use the lightweight JS analyzer instead.

Render notes:

```env
PYTHON_BIN=python
```

If the Render image reports Python unavailable, try `PYTHON_BIN=python3`. Fallback analysis is expected and safe when Python is missing.

## External Game Metadata

External game metadata is optional and backend-only. The app works without these keys.

```env
RAWG_API_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
```

FreeToGame does not need a key. RAWG enriches game covers when `RAWG_API_KEY` is present. IGDB is reserved for a future sync path and can stay blank.

Admin/local sync:

```powershell
npm run sync:external-games
```

If sync fails, the app still uses the built-in game catalog and cached MongoDB metadata.

## Check Commands

Client `.env` should keep the localhost fallback while still supporting deployed builds:

```env
VITE_API_URL=http://localhost:5000/api
VITE_LOCAL_API_URL=http://localhost:5000/api
VITE_PRODUCTION_API_URL=https://clutchq-backend.onrender.com/api
VITE_TURNSTILE_SITE_KEY=
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

Intelligence health:

```txt
http://localhost:5000/api/intelligence/health
```

## If Something Fails

- `MongoDB connection failed`: your database is not running or `MONGO_URI` is wrong.
- `docker compose` fails: start Docker Desktop first.
- Demo login missing: run `npm run seed`.
- Frontend API errors: confirm backend is running on `http://localhost:5000`.
- Scorecard analysis says lightweight analyzer: Python is unavailable or `PYTHON_BIN` is wrong; the app is still working with fallback analysis.
- OTP email not received locally: check the backend terminal for `DEV OTP`.
- OTP fails in production: confirm `TURNSTILE_SECRET_KEY`, `VITE_TURNSTILE_SITE_KEY`, and SMTP values are set, then redeploy Render and Vercel.
- Brevo test email fails: confirm `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, and `OTP_EMAIL_FROM` in Render or `server/.env`.

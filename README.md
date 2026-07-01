# ClutchQ

Skill-based gaming squad matchmaking platform that visually explains player compatibility, squad chemistry, role balance, availability overlap, and trust signals.

## Why ClutchQ?

Random teammates ruin ranked games. ClutchQ helps gamers build better squads using transparent matchmaking intelligence.

ClutchQ is not just a gaming matchmaking website. It is a squad intelligence system that visually explains why players should team up.

## Tagline

Find your perfect gaming squad before the match begins.

## Problem Statement

Ranked games often fall apart before they start: wrong roles, wrong region, no mic, no common language, no shared schedule, and no trust history. Basic LFG boards only show posts. They do not explain whether the squad will actually work.

## Solution

ClutchQ matches gamers using rank, role, region, language, availability, playstyle, reliability, reviews, and moderation signals. Every recommendation includes a score breakdown, positives, partial matches, warnings, and a suggested next action.

## Key SSS+++ Features

- Transparent matchmaking score with animated criterion-by-criterion explanation
- One-click Find Squad Now flow
- Squad chemistry graph with pairwise compatibility
- Role balance and missing role detector
- Availability heatmap and overlap visualizer
- Custom playstyle radar chart without chart libraries
- Trust score from reviews, reliability, no-shows, and report penalties
- Teammate requests and lobby join requests
- Owner-created Discord voice rooms for accepted lobby members
- Game-first browse hub with poster cards, filters, game detail pages, and room queues
- Steam-powered profile identity, library, recent activity, achievements, friends, heatmap, and player score
- Python-backed Gameplay Intelligence Pipeline for scorecards, rhythm, teammate fit, and profile graph insights
- Backend-cached external game metadata enrichment with safe catalog fallback
- Email OTP verification, password reset OTP, Cloudflare Turnstile validation, Helmet headers, and route-level rate limiting
- Profile account menu, mobile bottom navigation, retryable error states, and safer empty states
- Manual playtime tracking with session timer, match ratings, and match analysis
- Game and player leaderboards for weekly, monthly, and all-time activity
- Admin analytics and report moderation
- Rich seed data with 50+ gamer profiles, 30+ games, rooms, activity, and demo/admin accounts

## Tech Stack

- Frontend: ReactJS, Vite, JavaScript, Tailwind CSS, React Router DOM, Axios
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Analytics Worker: Python standard library, launched internally by Node child_process
- Auth: JWT, bcryptjs, Google OAuth, Discord OAuth, and Steam OpenID
- Integrations: Steam Web API and Discord Bot API for lobby voice rooms
- Tooling: nodemon and concurrently

No Angular, Vue, Next.js, Bootstrap, Material UI, Chakra, ShadCN, chart libraries, or external UI component libraries are used.

## Architecture

```txt
client/           React/Vite app, custom Tailwind components, game hub routes, route guards
server/           Express API, Mongoose models, JWT middleware, controllers, algorithms, seed data
analytics-worker/ Python JSON worker for safe gameplay intelligence analysis
docs/             Architecture, API, algorithm, and demo script notes
```

For final demo checks, use [docs/final-qa-checklist.md](docs/final-qa-checklist.md).

The backend owns source-of-truth scoring. Python is not a public backend; Express launches it as an internal worker, parses structured JSON, and falls back to a lightweight JS analyzer if Python is unavailable.

Production behavior is intentionally conservative: scorecard payloads are capped, Python failures fall back to deterministic JS analysis, external gaming APIs are cached through Express/MongoDB, and normal users never depend on optional MCP tooling.

## Folder Structure

```txt
clutchq/
├── client/
│   ├── public/clutchq-logo.svg
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       └── utils/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── seed/
│   └── utils/
├── analytics-worker/
│   ├── main.py
│   ├── scoring.py
│   ├── rhythm.py
│   └── gameplay_graph.py
├── docs/
├── screenshots/
└── README.md
```

## Matchmaking Algorithm

The match score is a 100-point compatibility model:

- Game match: 25 points
- Rank match: 20 points
- Region match: 15 points
- Language match: 10 points
- Availability overlap: 15 points
- Role balance: 10 points
- Playstyle fit: 5 points

The API returns the final score plus a breakdown, positives, partial matches, warnings, availability overlap, shared languages, and confidence level.

## Squad Chemistry Algorithm

Lobby chemistry computes pairwise compatibility between every squad member, averages those scores, identifies the strongest pair, flags the pair that needs coordination, detects missing roles, measures rank spread, and reports common language overlap.

## Trust Score Algorithm

Trust score combines review averages, reliability, completed sessions, no-show penalties, and report penalties:

```txt
Review Average = average(communication, teamwork, skill, punctuality, behavior)
Base Trust = Review Average * 20
Reliability Bonus = reliabilityScore * 0.2
No-show Penalty = noShows * 3
Report Penalty = validReports * 5
Final Score = clamp(0, 100)
```

## Database Schema Summary

- User: account, email, password hash, verification state, login safety counters, role, avatar, suspension state
- OtpToken: hashed one-time email/password reset codes with TTL, attempts, cooldown, and single-use consumption
- GamerProfile: game/rank/roles, region, languages, availability, playstyle, trust, badges
- Lobby: owner, game, rank range, region, language, members, requests, invite code, Discord voice room metadata
- Game: game catalog, poster/cover URLs, roles, platforms, modes, status, and activity metadata
- GameRoom: game-specific room, host, members, roles needed, ready status, and Discord voice metadata
- GameActivity: manual play sessions, result, duration, ratings, and notes
- GamePlaytimeAggregate: per-player game totals for weekly, monthly, and all-time leaderboards
- MatchAnalysis: rating breakdown, highlights, improvement areas, and trust impact
- ScorecardUpload: compressed user scorecard image data, processing status, and safe metadata
- ScorecardAnalysis: normalized scorecard stats, performance scores, situational signals, and confidence
- TeammateFeedback: optional post-session teammate ratings and comments
- GameplayGraph: profile intelligence score, rhythm summary, situational strengths, teammate edges, and recommendations
- Request: teammate or lobby request with pending/accepted/rejected/cancelled state
- Review: communication, teamwork, skill, punctuality, behavior, comment
- Report: reporter, reported user, reason, status, admin note
- Session: lobby history, members, result, chemistry score

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/demo`
- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`
- `GET /api/auth/me`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/discord`
- `GET /api/auth/discord/callback`
- `GET /api/auth/steam`
- `GET /api/auth/steam/callback`
- `GET /api/profiles`
- `GET /api/profiles/me`
- `PUT /api/profiles/me`
- `PATCH /api/profiles/me`
- `POST /api/profiles/avatar`
- `DELETE /api/profiles/avatar`
- `GET /api/profiles/summary`
- `GET /api/profiles/player-score`
- `GET /api/matchmaking/recommendations`
- `GET /api/matchmaking/compare/:profileId`
- `POST /api/matchmaking/find-squad-now`
- `GET /api/lobbies`
- `POST /api/lobbies`
- `GET /api/lobbies/:id`
- `POST /api/lobbies/:id/discord/create`
- `GET /api/lobbies/:id/discord`
- `DELETE /api/lobbies/:id/discord`
- `PATCH /api/lobbies/:id/ready`
- `PATCH /api/lobbies/:id/close`
- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests/:id`
- `GET /api/reviews`
- `POST /api/reviews`
- `POST /api/reports`
- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id`
- `GET /api/discord/health`
- `GET /api/games`
- `GET /api/games/:slug`
- `GET /api/games/:slug/rooms`
- `GET /api/games/:slug/stats`
- `GET /api/games/:slug/top-players`
- `GET /api/games/:slug/find-squad`
- `POST /api/game-rooms`
- `GET /api/game-rooms/:id`
- `POST /api/game-rooms/:id/join`
- `POST /api/game-rooms/:id/leave`
- `POST /api/game-rooms/:id/ready`
- `PATCH /api/game-rooms/:id`
- `DELETE /api/game-rooms/:id`
- `POST /api/game-rooms/:id/discord/create`
- `GET /api/game-rooms/:id/discord`
- `GET /api/steam/me`
- `POST /api/steam/sync`
- `GET /api/steam/sync-status`
- `GET /api/steam/library`
- `GET /api/steam/recent`
- `GET /api/steam/favorites`
- `GET /api/steam/achievements`
- `GET /api/steam/friends`
- `GET /api/steam/heatmap`
- `GET /api/steam/player-score`
- `GET /api/steam/match-insights`
- `GET /api/intelligence/health`
- `POST /api/intelligence/scorecards`
- `GET /api/intelligence/scorecards/me`
- `POST /api/intelligence/sessions/:sessionId/feedback`
- `POST /api/intelligence/graph/rebuild`
- `GET /api/intelligence/graph/me`
- `GET /api/intelligence/rhythm/me`
- `GET /api/intelligence/teammates/me`
- `GET /api/external/games/search?q=`
- `GET /api/external/games/:slug/metadata`
- `POST /api/external/games/sync`
- `POST /api/activity/start`
- `POST /api/activity/:id/stop`
- `GET /api/activity/me`
- `GET /api/activity/active`
- `GET /api/activity/game/:slug`
- `GET /api/activity/summary/me`
- `GET /api/leaderboards/games`
- `GET /api/leaderboards/players`
- `GET /api/leaderboards/trending-games`

## Game Hub

The game-first experience lives at:

- `/games` for browse, search, genres, and filters
- `/games/:slug` for game detail, active rooms, top players, user stats, and Find Squad Now
- `/games/:slug/rooms` for game-specific room creation and joining
- `/activity` for manual session tracking and match analysis
- `/leaderboards` for game and player rankings

Seed the richer game demo data with:

```bash
npm run seed:games
```

This upserts game catalog data, sample game rooms, activity records, playtime aggregates, and match analyses without deleting existing users.

## Local Setup

For the shortest step-by-step path, see [SETUP.md](SETUP.md).

```bash
git clone https://github.com/Abhi190702/ClutchQ.git
cd ClutchQ
npm run install-all
```

Create env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Server `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/clutchq
JWT_SECRET=replace_with_secure_secret
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=http://localhost:5000/api/auth/discord/callback
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_CATEGORY_ID=
STEAM_API_KEY=
STEAM_REALM=http://localhost:5000
STEAM_CALLBACK_URL=http://localhost:5000/api/auth/steam/callback
PYTHON_BIN=python
RAWG_API_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
TURNSTILE_SECRET_KEY=
OTP_EMAIL_FROM=ClutchQ <no-reply@example.com>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
OTP_TTL_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5
```

Client `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_LOCAL_API_URL=http://localhost:5000/api
VITE_PRODUCTION_API_URL=https://clutchq-backend.onrender.com/api
VITE_TURNSTILE_SITE_KEY=
```

Start MongoDB locally, use MongoDB Atlas, or start the included Docker MongoDB service:

```bash
npm run mongo
```

Then seed and run:

```bash
npm run seed
npm run seed:demo
npm run seed:games
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Discord Voice Rooms

ClutchQ can create a Discord voice channel for a lobby after the lobby owner clicks **Create Discord Voice Room**. The invite is returned only to the lobby owner and accepted members.

Required `server/.env` values:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_server_id
DISCORD_CATEGORY_ID=optional_category_id_for_voice_rooms
```

If `DISCORD_CATEGORY_ID` is blank, channels are created directly in the server. If it is set, channels are created inside that category.

The Discord bot needs:

- Manage Channels
- Create Invite
- View Channels
- Connect
- Speak

Manual test:

1. Log in and open a lobby you own.
2. Click **Create Discord Voice Room**.
3. Confirm a voice channel appears in the configured Discord server/category.
4. Use **Join Voice Room** or **Copy Invite**.
5. Refresh the lobby and create again; the existing room should be reused.
6. Check as a non-member; the invite should not be visible.

## Steam Integration

Steam login uses OpenID, and Steam profile/library data is fetched only by the backend with `STEAM_API_KEY`. Never put the Steam API key in `client/.env`.

Local server values:

```env
STEAM_API_KEY=your_steam_web_api_key
STEAM_REALM=http://localhost:5000
STEAM_CALLBACK_URL=http://localhost:5000/api/auth/steam/callback
```

Production Render values:

```env
STEAM_REALM=https://clutchq-backend.onrender.com
STEAM_CALLBACK_URL=https://clutchq-backend.onrender.com/api/auth/steam/callback
```

Steam privacy matters: library, friends, achievements, and recent activity only sync when the connected Steam profile exposes that data publicly.

## Security Hardening

ClutchQ keeps public auth actions small and guarded:

- Email accounts register first, then verify email through a 6-digit OTP banner inside the app.
- OTPs are HMAC hashed with the server secret, expire by TTL, are single-use, and lock after repeated wrong attempts.
- Password reset uses the same OTP system and returns generic responses so email existence is not exposed.
- Cloudflare Turnstile is verified only on the backend for OTP and password reset requests.
- `TURNSTILE_SECRET_KEY`, SMTP credentials, OAuth secrets, Steam keys, and MongoDB URIs stay server-only.
- Helmet sets security headers, Render proxy trust is enabled, strict CORS allows only known frontend origins, and auth/OTP/scorecard routes are rate-limited.
- Demo and OAuth/Steam users are treated as verified so judging accounts and provider sign-ins stay usable.

Turnstile production values:

```env
# server / Render
TURNSTILE_SECRET_KEY=

# client / Vercel
VITE_TURNSTILE_SITE_KEY=
```

SMTP production values:

```env
OTP_EMAIL_FROM=ClutchQ <no-reply@example.com>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

## Gameplay Intelligence Pipeline

ClutchQ combines public and user-consented signals into a Gameplay Graph:

- Steam library, recent playtime, achievements, friends, and heatmap data already synced by the backend
- Manual ClutchQ sessions, match ratings, results, and duration
- Optional user-uploaded scorecard screenshots compressed to a safe data URL under 900KB
- Optional user-confirmed scorecard stats
- Optional teammate feedback after a session
- Demo seed data for judge-ready accounts

The React UI calls Express. Express stores validated data in MongoDB, launches `analytics-worker/main.py` with JSON over stdin, reads one JSON response from stdout, and stores the result. If Python is missing or fails, `server/services/fallbackAnalyticsService.js` returns deterministic fallback analysis so the app stays usable.

Scorecard safety:

- Express accepts JSON/urlencoded payloads up to 1.5MB.
- Scorecard images must be PNG, JPG, or WebP data URLs.
- SVG uploads are rejected.
- The controller rejects compressed scorecard data above 900KB.
- Manual stats are validated as non-negative numbers and teammate ratings must be 1-5.
- Intelligence routes use the logged-in `req.user._id`; client-provided user IDs are not trusted.

Intelligence routes:

- `GET /api/intelligence/health`
- `POST /api/intelligence/scorecards`
- `GET /api/intelligence/scorecards/me`
- `POST /api/intelligence/sessions/:sessionId/feedback`
- `POST /api/intelligence/graph/rebuild`
- `GET /api/intelligence/graph/me`
- `GET /api/intelligence/rhythm/me`
- `GET /api/intelligence/teammates/me`

Local worker smoke test:

```powershell
Get-Content -Raw analytics-worker/sample_inputs/session_bundle.json | python analytics-worker/main.py
```

The worker uses only Python standard library in this stable version. OCR can be added later with Pillow, pytesseract, or OpenCV, but scorecard upload works today with manual stat confirmation and fallback analysis. ClutchQ does not read game memory, hook processes, packet sniff, bypass anti-cheat, or scrape private account data.

## External Game Metadata Cache

ClutchQ can enrich game covers and metadata through backend-only external API services:

- FreeToGame works without a key.
- RAWG is optional through `RAWG_API_KEY`.
- IGDB is documented as future optional setup and is not required today.

React never calls these APIs directly. Express syncs and caches metadata in MongoDB through `ExternalGameMetadata`, then game pages read cached data. If an external API is down or no key is configured, `/api/games` and game detail pages continue using the built-in catalog.

Admin-only sync:

```bash
npm run sync:external-games
```

Route-level sync is admin protected:

```txt
POST /api/external/games/sync
```

## Optional MCP Tooling

MCP is optional dev/admin tooling only. It is not required for users, production matchmaking, scorecard analysis, or demo flow. See [docs/mcp-plan.md](docs/mcp-plan.md) for the planned tools and safety boundaries.

## Demo Credentials

Seeded demo users:

```txt
Abhijeet: demo@clutchq.com / demo123
CaptainRex: captain@clutchq.com / demo123
NovaSentinel: sentinel@clutchq.com / demo123
FlexByte: flex@clutchq.com / demo123
```

Admin:

```txt
Email: admin@clutchq.com
Password: admin123
```

The demo accounts include richer profile data, lobbies, requests, activity history, Steam-like library data, achievements, friends, scorecard analyses, teammate feedback, Gameplay Graphs, rhythm summaries, and compatibility signals. They are safe for live judging when a real Steam account has private or empty library data.

To add or refresh only the demo users without wiping a database, run:

```bash
npm run seed:demo
```

For production, run it only when `server/.env` or Render has `NODE_ENV=production` and `MONGO_URI` pointing at the intended Atlas database. This command upserts the demo users and refreshes demo-only lobbies, requests, activity, and Steam-like data.

## Screenshots

Add screenshots to `screenshots/` after running the app locally:

- Landing page
- Dashboard recommendations
- Find Squad Now result
- Lobby chemistry graph
- Admin dashboard

## Demo Script

See [docs/demo-script.md](docs/demo-script.md).

## Future Scope

- Real-time lobby chat and ready checks with WebSockets
- Epic Games, Microsoft, PlayStation, Xbox, and Nintendo account linking
- Deeper Steam achievement rarity analysis
- Optional OCR for uploaded scorecards
- Anti-toxicity reputation weighting
- Tournament team builder mode
- ML-assisted role recommendation
- Mobile PWA install flow

## GitHub Push Instructions

```bash
git add .
git commit -m "Initial commit: build ClutchQ SSS gaming matchmaking platform"
git branch -M main
git remote set-url origin https://github.com/Abhi190702/ClutchQ.git
git push -u origin main
```

For follow-up fixes:

```bash
git add .
git commit -m "Polish UI, seed data, matchmaking visuals, and admin analytics"
git push
```

## Common Errors

- MongoDB connection failed: start local MongoDB or set `MONGO_URI` to Atlas.
- Demo login not found: run `npm run seed`. If your local `server/.env` has `NODE_ENV=production`, either change it to `development` for local testing or run PowerShell with `$env:NODE_ENV='development'; npm run seed`.
- Game browse is empty: run `npm run seed:games`, or the app will fall back to the built-in catalog until MongoDB has game rows.
- Vite cannot reach API: confirm `server/.env` `PORT=5000` and `client/.env` `VITE_LOCAL_API_URL=http://localhost:5000/api`.
- JWT errors after changing secrets: log out, clear local storage, and log in again.

## License

MIT

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
- Admin analytics and report moderation
- Rich seed data with 50+ gamer profiles and demo/admin accounts

## Tech Stack

- Frontend: ReactJS, Vite, JavaScript, Tailwind CSS, React Router DOM, Axios
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Auth: JWT, bcryptjs, Google OAuth, and Discord OAuth
- Integrations: Discord Bot API for lobby voice rooms
- Tooling: nodemon and concurrently

No Angular, Vue, Next.js, Bootstrap, Material UI, Chakra, ShadCN, chart libraries, or external UI component libraries are used.

## Architecture

```txt
client/  React/Vite app, custom Tailwind components, route guards, visual explainers
server/  Express API, Mongoose models, JWT middleware, controllers, algorithms
docs/    Architecture, API, algorithm, and demo script notes
```

The backend owns source-of-truth scoring. The frontend renders those explanations as score rings, DNA animations, heatmaps, radar charts, role balance panels, and chemistry graphs.

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
│   └── utils/
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

- User: account, email, password hash, role, avatar, suspension state
- GamerProfile: game/rank/roles, region, languages, availability, playstyle, trust, badges
- Lobby: owner, game, rank range, region, language, members, requests, invite code, Discord voice room metadata
- Request: teammate or lobby request with pending/accepted/rejected/cancelled state
- Review: communication, teamwork, skill, punctuality, behavior, comment
- Report: reporter, reported user, reason, status, admin note
- Session: lobby history, members, result, chemistry score

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/demo`
- `GET /api/auth/me`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/discord`
- `GET /api/auth/discord/callback`
- `GET /api/profiles`
- `GET /api/profiles/me`
- `PUT /api/profiles/me`
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
```

Client `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start MongoDB locally, use MongoDB Atlas, or start the included Docker MongoDB service:

```bash
npm run mongo
```

Then seed and run:

```bash
npm run seed
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

## Demo Credentials

Demo User:

```txt
Email: demo@clutchq.com
Password: demo123
```

Admin:

```txt
Email: admin@clutchq.com
Password: admin123
```

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
- Steam, Epic Games, Microsoft, PlayStation, Xbox, and Nintendo account linking
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
- Demo login not found: run `npm run seed`.
- Vite cannot reach API: confirm `server/.env` `PORT=5000` and `client/.env` `VITE_API_URL=http://localhost:5000/api`.
- JWT errors after changing secrets: log out, clear local storage, and log in again.

## License

MIT

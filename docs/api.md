# ClutchQ API

All responses use:

```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/demo`
- `GET /api/auth/me`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/discord`
- `GET /api/auth/discord/callback`
- `GET /api/auth/steam`
- `GET /api/auth/steam/callback`

## Profiles

- `GET /api/profiles`
- `GET /api/profiles/me`
- `PUT /api/profiles/me`
- `PATCH /api/profiles/me`
- `POST /api/profiles/avatar`
- `DELETE /api/profiles/avatar`
- `GET /api/profiles/summary`
- `GET /api/profiles/player-score`
- `GET /api/profiles/:id`
- `GET /api/profiles/user/:userId`

## Matchmaking

- `GET /api/matchmaking/recommendations`
- `GET /api/matchmaking/explain/:profileId`
- `GET /api/matchmaking/compare/:profileId`
- `POST /api/matchmaking/find-squad-now`

## Lobbies

- `GET /api/lobbies`
- `POST /api/lobbies`
- `GET /api/lobbies/:id`
- `POST /api/lobbies/:id/discord/create`
- `GET /api/lobbies/:id/discord`
- `DELETE /api/lobbies/:id/discord`
- `PATCH /api/lobbies/:id/ready`
- `PATCH /api/lobbies/:id/close`

## Games And Rooms

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

## Steam

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

## Gameplay Intelligence

- `GET /api/intelligence/health`
- `POST /api/intelligence/scorecards`
- `GET /api/intelligence/scorecards/me`
- `POST /api/intelligence/sessions/:sessionId/feedback`
- `POST /api/intelligence/graph/rebuild`
- `GET /api/intelligence/graph/me`
- `GET /api/intelligence/rhythm/me`
- `GET /api/intelligence/teammates/me`

These routes use the logged-in user from JWT and never accept a client-provided `userId` as authority. Scorecard uploads accept PNG, JPG, or WebP data URLs only, with a compressed payload limit of 900KB.

## Requests

- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests/:id`

## Reviews, Reports, Sessions

- `GET /api/reviews`
- `POST /api/reviews`
- `POST /api/reports`
- `GET /api/sessions`
- `POST /api/sessions`
- `POST /api/activity/start`
- `POST /api/activity/:id/stop`
- `GET /api/activity/me`
- `GET /api/activity/active`
- `GET /api/activity/game/:slug`
- `GET /api/activity/summary/me`

## Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id`

## Health And Discord Setup

- `GET /api/health`
- `GET /api/discord/health`

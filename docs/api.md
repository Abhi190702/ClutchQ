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

## Profiles

- `GET /api/profiles`
- `GET /api/profiles/me`
- `PUT /api/profiles/me`
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
- `PATCH /api/lobbies/:id/ready`
- `PATCH /api/lobbies/:id/close`

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

## Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id`

# 3-Minute Hackathon Demo Flow

1. Open the landing page and state the problem: random teammates break ranked games before the match starts.
2. Login with the demo account: `demo@clutchq.com` / `demo123`.
3. Open `/games` and show the game hub, filters, and active room cards.
4. Open a game detail page and explain that ClutchQ is game-first, not a generic LFG board.
5. Click **Find Squad Now** and show the match breakdown, including graph fit reasons when present.
6. Expand **Why this match?** on a player card to show role, rank, region, mic, availability, and graph signals.
7. Open `/activity` and show Gaming Rhythm: tracked minutes, active days, game mix, recent sessions, and teammate fit.
8. Start a manual session, stop it, and show the Match Wrap-Up flow. Upload a scorecard or enter manual stats, then submit optional teammate feedback.
9. Show the generated scorecard analysis and explain that Python is an internal worker with a safe JS fallback.
10. Open Profile and show the Gameplay Graph, situational strengths, connected platforms, Steam library, avatar upload, and teammate edges.
11. Create or open a lobby and show member fit, ready checks, squad chemistry, and the Discord voice room controls if env is configured.
12. If asked about reliability, open `/api/intelligence/health` and explain Python/fallback status.
13. If time remains, open Leaderboards and Admin Dashboard to show activity ranking and moderation.

Close with future scope:

- Real-time room chat and notifications
- Optional OCR for uploaded scorecards
- Deeper Steam achievement rarity analysis
- More cross-platform integrations
- Tournament/team-builder mode

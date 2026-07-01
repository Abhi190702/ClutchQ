# ClutchQ Algorithms

## Match Score

The score is transparent and criterion-based:

| Criterion | Max |
| --- | ---: |
| Game match | 25 |
| Rank match | 20 |
| Region match | 15 |
| Language overlap | 10 |
| Availability overlap | 15 |
| Role balance | 10 |
| Playstyle fit | 5 |

Each criterion returns:

- `score`
- `max`
- `status`: `matched`, `partial`, or `warning`
- `reason`

The frontend renders this as the Live DNA visualizer and the expandable Why This Match panel.

## Availability

Availability is stored as cells:

```json
[
  { "day": 1, "hour": 20 },
  { "day": 1, "hour": 21 },
  { "day": 1, "hour": 22 }
]
```

Day `0` is Sunday. Hour `23` is 11 PM. Three or more shared cells counts as a strong overlap.

## Squad Chemistry

For each lobby:

1. Calculate pairwise compatibility for every member pair.
2. Average pair scores into `chemistryScore`.
3. Detect strongest pair.
4. Detect the pair that needs coordination.
5. Detect missing roles.
6. Detect rank spread and language overlap.

The API returns `roleBalance`, `pairwiseScores`, `warnings`, `strongestPair`, and `needsCoordinationPair`.

## Trust Score

Trust combines teammate reviews and reliability:

```txt
Review Average = average(communication, teamwork, skill, punctuality, behavior)
Base Trust = Review Average * 20
Reliability Bonus = reliabilityScore * 0.2
No-show Penalty = noShows * 3
Report Penalty = valid reports * 5
Completed Boost = completed sessions * 0.4 capped at 8
Final Score = clamp(0, 100)
```

## Gameplay Intelligence

The Gameplay Intelligence Pipeline uses only public, manual, or user-consented data: Steam sync data, ClutchQ sessions, optional scorecard uploads, user-confirmed stats, teammate feedback, reviews, lobbies, and demo seed records. It does not inspect game memory, hook processes, packet sniff, bypass anti-cheat, or claim live telemetry.

This is explainable squad intelligence, not win prediction. Scores describe how complete and useful a player profile is for matchmaking, not whether a player will win the next match. Missing data lowers confidence and falls back to clear recommendations instead of inventing certainty.

### Scorecard Performance

Scorecard analysis normalizes uploaded or manually entered stats into 0-100 scores:

```txt
FPS combat = kills + assists + damage/score context
FPS survival = low deaths + duration context
FPS support = assists + teammate feedback
FPS objective focus = result + score + game defaults
FPS impact = combat + result + score

Battle royale combat = kills + damage
Battle royale survival = placement + survival time
Co-op weights support, reliability, teamwork, and completion higher than raw combat
```

Every value is clamped from 0 to 100. Missing data lowers confidence instead of producing fake certainty.

### Rhythm Score

```txt
Rhythm Score =
0.35 * recent frequency
+ 0.25 * consistency
+ 0.20 * session length quality
+ 0.10 * game focus
+ 0.10 * rating stability
```

- Recent frequency: active days in the last 14 days.
- Consistency: active days in the last 30 days.
- Session length quality: 60 to 180 minute sessions score highest.
- Game focus: 1 to 3 dominant games score better than extreme scatter.
- Rating stability: steady match ratings score better than volatile ratings.

### Gameplay Profile Score

```txt
Gameplay Profile Score =
0.20 * Steam depth
+ 0.20 * session activity
+ 0.20 * scorecard performance
+ 0.20 * teammate feedback
+ 0.10 * trust and reliability
+ 0.10 * situational strength
```

This is a profile intelligence score, not a skill rank. It explains how complete and useful a player's squad signal is.

### Teammate Fit

```txt
Teammate Fit =
0.30 * existing match score
+ 0.20 * shared games
+ 0.15 * shared sessions
+ 0.15 * teammate feedback
+ 0.10 * availability overlap
+ 0.10 * trust safety
```

The dashboard keeps the existing match engine as the base and adds a small Gameplay Graph bonus only when graph data exists. Missing graph data never breaks recommendations.

### Confidence Layer

Confidence rises when the player has more recent sessions, scorecard analyses, teammate feedback, and Steam context. Empty or private accounts show clean empty states and lower confidence rather than inflated scores.

## Badges

Badges are generated from reliability, mic status, ratings, created lobbies, reports, roles, and playstyle stats.

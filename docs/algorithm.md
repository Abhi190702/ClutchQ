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

## Badges

Badges are generated from reliability, mic status, ratings, created lobbies, reports, roles, and playstyle stats.

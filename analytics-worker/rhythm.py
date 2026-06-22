from collections import defaultdict
from datetime import datetime, timedelta, timezone
from schemas import clamp, compact_date, safe_number


def label_for(date_key):
    date = datetime.fromisoformat(date_key)
    return f"{date.strftime('%b')} {date.day}"


def streak_from_dates(active_dates):
    if not active_dates:
        return 0, 0
    ordered = sorted(active_dates)
    best = current = 1
    for index in range(1, len(ordered)):
        gap = (ordered[index] - ordered[index - 1]).days
        if gap == 1:
            current += 1
        else:
            best = max(best, current)
            current = 1
    best = max(best, current)

    today = datetime.now(timezone.utc).date()
    current_streak = 0
    cursor = today
    active_set = set(ordered)
    while cursor in active_set:
        current_streak += 1
        cursor -= timedelta(days=1)
    if current_streak == 0 and ordered[-1] == today - timedelta(days=1):
        cursor = ordered[-1]
        while cursor in active_set:
            current_streak += 1
            cursor -= timedelta(days=1)
    return current_streak, best


def build_rhythm(payload):
    sessions = payload.get("sessions") or []
    steam_heatmap = payload.get("steamHeatmap") or []
    steam_library = payload.get("steamLibrary") or []
    by_date = defaultdict(lambda: {"minutes": 0, "games": defaultdict(float)})
    game_totals = defaultdict(lambda: {"gameName": "", "minutes": 0})

    for day in steam_heatmap:
        date_key = str(day.get("date") or "")[:10]
        minutes = safe_number(day.get("totalMinutes"), 0)
        if date_key:
            by_date[date_key]["minutes"] += minutes
            for game in day.get("games") or []:
                name = game.get("gameName") or game.get("name") or "Steam"
                game_minutes = safe_number(game.get("minutes"), 0)
                by_date[date_key]["games"][name] += game_minutes
                game_totals[name]["gameName"] = name
                game_totals[name]["minutes"] += game_minutes

    for session in sessions:
        started = compact_date(session.get("startedAt"))
        if not started:
            continue
        date_key = started.date().isoformat()
        minutes = safe_number(session.get("durationMinutes"), 0)
        game_name = session.get("gameName") or "Session"
        by_date[date_key]["minutes"] += minutes
        by_date[date_key]["games"][game_name] += minutes
        game_totals[game_name]["gameName"] = game_name
        game_totals[game_name]["minutes"] += minutes

    for game in steam_library:
        name = game.get("gameName") or game.get("name")
        if not name:
            continue
        minutes = safe_number(game.get("playtimeForeverMinutes") or game.get("totalMinutes"), 0)
        game_totals[name]["gameName"] = name
        game_totals[name]["minutes"] = max(game_totals[name]["minutes"], minutes)

    if by_date:
        dates = [datetime.fromisoformat(key).date() for key in by_date.keys()]
        end_date = max(max(dates), datetime.now(timezone.utc).date())
    else:
        end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=55)

    series = []
    active_dates = []
    for index in range(56):
        current = start_date + timedelta(days=index)
        key = current.isoformat()
        day = by_date.get(key, {"minutes": 0, "games": {}})
        minutes = round(day["minutes"])
        if minutes > 0:
            active_dates.append(current)
        games = [
            {"gameName": name, "minutes": round(minutes_value)}
            for name, minutes_value in sorted(day["games"].items(), key=lambda item: item[1], reverse=True)[:3]
        ]
        series.append({"date": key, "label": f"{current.strftime('%b')} {current.day}", "minutes": minutes, "games": games})

    total_minutes = sum(item["minutes"] for item in series)
    active_days = len(active_dates)
    best_day = max([item["minutes"] for item in series], default=0)
    current_streak, best_streak = streak_from_dates(active_dates)
    game_mix_raw = sorted(game_totals.values(), key=lambda item: item["minutes"], reverse=True)
    total_game_minutes = sum(item["minutes"] for item in game_mix_raw) or total_minutes or 1
    game_mix = [
        {
            "gameSlug": item["gameName"].lower().replace(" ", "-"),
            "gameName": item["gameName"],
            "minutes": round(item["minutes"]),
            "share": clamp(item["minutes"] / total_game_minutes * 100),
        }
        for item in game_mix_raw[:8]
        if item["minutes"] > 0
    ]
    dominant = game_mix[0] if game_mix else {"gameName": "No dominant game", "share": 0}

    last_14 = series[-14:]
    last_30 = series[-30:]
    active_14 = len([item for item in last_14 if item["minutes"] > 0])
    active_30 = len([item for item in last_30 if item["minutes"] > 0])
    recent_frequency = active_14 / 14 * 100
    consistency = active_30 / 30 * 100
    lengths = [item["minutes"] for item in series if item["minutes"] > 0]
    length_quality = sum(100 if 60 <= value <= 180 else 72 if 30 <= value < 240 else 48 for value in lengths) / len(lengths) if lengths else 0
    game_focus = 90 if 1 <= len(game_mix) <= 3 else 70 if len(game_mix) <= 5 else 55
    ratings = [safe_number(session.get("matchRating"), None) for session in sessions if safe_number(session.get("matchRating"), None) is not None]
    if len(ratings) > 1:
        avg = sum(ratings) / len(ratings)
        variance = sum((item - avg) ** 2 for item in ratings) / len(ratings)
        rating_stability = clamp(100 - variance ** 0.5)
    else:
        rating_stability = 70 if ratings else 50

    rhythm_score = clamp(
        recent_frequency * 0.35
        + consistency * 0.25
        + length_quality * 0.20
        + game_focus * 0.10
        + rating_stability * 0.10
    )

    insights = []
    if active_14 >= 6:
        insights.append("Your recent play rhythm is steady across the last two weeks.")
    elif active_14:
        insights.append("Your rhythm is active but still forming a stronger weekly pattern.")
    else:
        insights.append("Start or sync sessions to build a reliable rhythm read.")
    if dominant.get("share"):
        insights.append(f"{dominant['gameName']} currently dominates your activity mix.")
    if length_quality >= 75:
        insights.append("Your session lengths are in a healthy competitive window.")
    else:
        insights.append("Shorter focused sessions may improve consistency.")

    return {
        "summary": {
            "totalMinutes": round(total_minutes),
            "activeDays": active_days,
            "bestDayMinutes": round(best_day),
            "currentStreak": current_streak,
            "bestStreak": best_streak,
            "dominantGame": dominant.get("gameName"),
            "dominantGameShare": dominant.get("share", 0),
            "rhythmScore": rhythm_score,
        },
        "series": series,
        "gameMix": game_mix,
        "insights": insights[:4],
        "confidence": 0.88 if total_minutes else 0.48,
    }

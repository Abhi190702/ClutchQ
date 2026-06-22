from collections import defaultdict
from schemas import clamp, safe_number


def average(values, fallback=0):
    values = [safe_number(value, None) for value in values if safe_number(value, None) is not None]
    return sum(values) / len(values) if values else fallback


def rebuild_gameplay_graph(payload):
    sessions = payload.get("sessions") or []
    scorecards = payload.get("scorecardAnalyses") or []
    feedback = payload.get("feedbackReceived") or []
    steam_library = payload.get("steamLibrary") or []
    achievements = payload.get("steamAchievements") or []
    lobbies = payload.get("lobbies") or []

    steam_minutes = sum(safe_number(game.get("playtimeForeverMinutes") or game.get("totalMinutes"), 0) for game in steam_library)
    session_minutes = sum(safe_number(session.get("durationMinutes"), 0) for session in sessions)
    scorecard_overall = average([item.get("performance", {}).get("overall") for item in scorecards], 60)
    feedback_score = average([
        average((item.get("ratings") or {}).values(), 3.5) * 20
        for item in feedback
    ], 70)
    trust_signal = average([item.get("matchRating") for item in sessions], 70)
    situational = average([
        average((item.get("situationalSignals") or {}).values(), 70)
        for item in scorecards
    ], 68)
    steam_depth = clamp(min(100, steam_minutes / 300))
    session_activity = clamp(min(100, session_minutes / 40 + len(sessions) * 3))
    achievement_signal = clamp(len([item for item in achievements if item.get("achieved")]) * 2)

    gameplay_score = clamp(
        steam_depth * 0.16
        + achievement_signal * 0.04
        + session_activity * 0.20
        + scorecard_overall * 0.20
        + feedback_score * 0.20
        + trust_signal * 0.10
        + situational * 0.10
    )

    by_game = defaultdict(lambda: {"minutes": 0, "sessions": 0, "ratings": [], "performance": []})
    for game in steam_library:
        name = game.get("gameName") or game.get("name") or "Steam game"
        key = game.get("gameSlug") or name.lower().replace(" ", "-")
        by_game[key]["gameSlug"] = key
        by_game[key]["gameName"] = name
        by_game[key]["minutes"] += safe_number(game.get("playtimeForeverMinutes") or game.get("totalMinutes"), 0)
    for session in sessions:
        key = session.get("gameSlug") or "unknown"
        by_game[key]["gameSlug"] = key
        by_game[key]["gameName"] = session.get("gameName") or by_game[key].get("gameName") or "Session"
        by_game[key]["minutes"] += safe_number(session.get("durationMinutes"), 0)
        by_game[key]["sessions"] += 1
        by_game[key]["ratings"].append(safe_number(session.get("matchRating"), None))
    for card in scorecards:
        key = card.get("gameSlug") or "unknown"
        by_game[key]["gameSlug"] = key
        by_game[key]["gameName"] = card.get("gameName") or by_game[key].get("gameName") or "Scorecard"
        by_game[key]["performance"].append(card.get("performance") or {})

    game_profiles = []
    for item in sorted(by_game.values(), key=lambda value: value["minutes"], reverse=True)[:6]:
        performances = item["performance"]
        performance = {
            "combat": clamp(average([entry.get("combat") for entry in performances], 65)),
            "support": clamp(average([entry.get("support") for entry in performances], 70)),
            "survival": clamp(average([entry.get("survival") for entry in performances], 68)),
            "objectiveFocus": clamp(average([entry.get("objectiveFocus") for entry in performances], 68)),
        }
        support_bias = performance["support"] - performance["combat"]
        role_signal = "Sentinel / Support" if support_bias >= 8 else "Entry / Impact" if performance["combat"] >= 76 else "Flex"
        game_profiles.append({
            "gameSlug": item["gameSlug"],
            "gameName": item["gameName"],
            "minutes": round(item["minutes"]),
            "sessions": item["sessions"],
            "averageRating": clamp(average(item["ratings"], scorecard_overall)),
            "performance": performance,
            "roleSignal": role_signal,
        })

    signal_scores = defaultdict(list)
    for card in scorecards:
        for key, value in (card.get("situationalSignals") or {}).items():
            signal_scores[key].append(value)
    labels = {
        "teamSupport": "Team support",
        "pressureHandling": "Pressure handling",
        "objectiveFocus": "Objective focus",
        "clutchPotential": "Clutch potential",
        "tiltResistance": "Tilt resistance",
        "entryPressure": "Entry pressure",
    }
    strengths = [
        {
            "key": key,
            "label": labels.get(key, key),
            "score": clamp(average(values, 70)),
            "evidence": "Built from scorecards, teammate feedback, and session ratings.",
        }
        for key, values in signal_scores.items()
    ]
    if not strengths:
        strengths = [
            {"key": "teamSupport", "label": "Team support", "score": clamp(feedback_score), "evidence": "Based on teammate feedback and completed sessions."},
            {"key": "consistency", "label": "Consistency", "score": clamp(session_activity), "evidence": "Based on recent tracked activity."},
        ]
    strengths = sorted(strengths, key=lambda item: item["score"], reverse=True)[:5]

    main_style = "Structured support" if feedback_score >= scorecard_overall else "Impact flex"
    if scorecard_overall >= 82 and feedback_score >= 82:
        main_style = "High-impact team anchor"
    best_squad_fit = "Ranked squad with clear roles and comms" if gameplay_score >= 70 else "Casual stack building consistent rhythm"

    teammate_edges = []
    seen = set()
    for lobby in lobbies[:8]:
        for member in lobby.get("currentMembers") or []:
            user_id = str(member.get("userId") or member.get("_id") or "")
            if not user_id or user_id in seen:
                continue
            seen.add(user_id)
            teammate_edges.append({
                "userId": user_id,
                "name": member.get("name") or "ClutchQ teammate",
                "compatibility": clamp(70 + gameplay_score * 0.2),
                "sharedGames": [game_profiles[0]["gameName"]] if game_profiles else [],
                "reason": "Shared lobby history and compatible activity signals.",
            })

    recommendations = [
        "Best in structured squads with clear comms.",
        "Pair with players who complement your strongest situational signal.",
        "Keep sessions under 2.5h for best consistency.",
    ]

    confidence = 0.42
    if sessions:
        confidence += 0.16
    if scorecards:
        confidence += 0.18
    if feedback:
        confidence += 0.14
    if steam_library:
        confidence += 0.1

    return {
        "gameplayProfileScore": gameplay_score,
        "confidence": round(min(0.92, confidence), 2),
        "style": {
            "mainStyle": main_style,
            "competitiveTendency": clamp(scorecard_overall * 0.6 + trust_signal * 0.4),
            "cooperativeTendency": clamp(feedback_score * 0.7 + situational * 0.3),
            "riskProfile": "Balanced",
            "bestSquadFit": best_squad_fit,
        },
        "gameProfiles": game_profiles,
        "situationalStrengths": strengths,
        "teammateEdges": teammate_edges,
        "recommendations": recommendations,
    }


def compute_teammate_fit(payload):
    viewer_graph = payload.get("viewerGraph") or {}
    candidate_graphs = payload.get("candidateGraphs") or []
    candidate_profiles = payload.get("candidateProfiles") or []
    profile_by_user = {str((profile.get("userId") or {}).get("_id") or profile.get("userId") or profile.get("_id")): profile for profile in candidate_profiles}
    viewer_games = {item.get("gameName") for item in viewer_graph.get("gameProfiles") or [] if item.get("gameName")}
    edges = {str(item.get("userId")): item for item in viewer_graph.get("teammateEdges") or []}
    matches = []

    for graph in candidate_graphs:
        user_id = str(graph.get("userId") or "")
        profile = profile_by_user.get(user_id, {})
        candidate_games = {item.get("gameName") for item in graph.get("gameProfiles") or [] if item.get("gameName")}
        shared_games = sorted([game for game in viewer_games.intersection(candidate_games) if game])
        shared_score = min(100, len(shared_games) * 34)
        edge = edges.get(user_id)
        base = safe_number(profile.get("matchScore"), 70)
        feedback = safe_number(graph.get("gameplayProfileScore"), 65)
        compatibility = clamp(base * 0.30 + shared_score * 0.20 + (edge.get("compatibility") if edge else 65) * 0.15 + feedback * 0.15 + 70 * 0.10 + 76 * 0.10)
        reasons = []
        if shared_games:
            reasons.append("Shared game profile.")
        if edge:
            reasons.append(edge.get("reason") or "Previous teammate edge.")
        if feedback >= 75:
            reasons.append("Strong gameplay graph confidence.")
        matches.append({
            "userId": user_id,
            "name": profile.get("displayName") or graph.get("name") or "ClutchQ player",
            "compatibility": compatibility,
            "confidence": min(0.9, safe_number(graph.get("confidence"), 0.5)),
            "sharedGames": shared_games[:3],
            "reasons": reasons[:3] or ["Compatible public gameplay signals."],
            "warnings": [] if graph.get("confidence", 0) >= 0.45 else ["Low confidence: limited history."],
        })

    return {"matches": sorted(matches, key=lambda item: item["compatibility"], reverse=True)[:12]}

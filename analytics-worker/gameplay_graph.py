from collections import defaultdict
from schemas import clamp, safe_number


def average(values, fallback=None):
    clean = [safe_number(value, None) for value in values]
    clean = [value for value in clean if value is not None]
    return sum(clean) / len(clean) if clean else fallback


def weighted_average(items, fallback=0):
    known = [(value, weight) for value, weight in items if value is not None]
    if not known:
        return fallback
    total_weight = sum(weight for _, weight in known)
    return sum(value * weight for value, weight in known) / total_weight


def object_id(value):
    if isinstance(value, dict):
        return str(value.get("_id") or value.get("id") or "")
    return str(value or "")


def rebuild_gameplay_graph(payload):
    payload = payload or {}
    sessions = payload.get("sessions") or []
    scorecards = payload.get("scorecardAnalyses") or []
    feedback = payload.get("feedbackReceived") or []
    feedback_given = payload.get("feedbackGiven") or []
    steam_library = payload.get("steamLibrary") or []
    achievements = payload.get("steamAchievements") or []
    lobbies = payload.get("lobbies") or []
    profile = payload.get("profile") or {}
    viewer_id = object_id((payload.get("user") or {}).get("_id"))

    steam_minutes = sum(max(0, safe_number(game.get("playtimeForeverMinutes") or game.get("totalMinutes"), 0)) for game in steam_library)
    session_minutes = sum(max(0, safe_number(session.get("durationMinutes"), 0)) for session in sessions)
    scorecard_overall = average([item.get("performance", {}).get("overall") for item in scorecards])
    feedback_score = average([
        average((item.get("ratings") or {}).values()) * 20
        for item in feedback
        if average((item.get("ratings") or {}).values()) is not None
    ])
    trust_signal = average([item.get("matchRating") for item in sessions])
    situational = average([
        average((item.get("situationalSignals") or {}).values())
        for item in scorecards
        if average((item.get("situationalSignals") or {}).values()) is not None
    ])
    steam_depth = clamp(min(100, steam_minutes / 300)) if steam_library else None
    session_activity = clamp(min(100, session_minutes / 40 + len(sessions) * 3)) if sessions else None
    achievement_signal = None
    if achievements:
        achieved_count = len([item for item in achievements if item.get("achieved")])
        achievement_signal = clamp(achieved_count / len(achievements) * 100)

    gameplay_score = clamp(weighted_average([
        (steam_depth, 0.16),
        (achievement_signal, 0.04),
        (session_activity, 0.20),
        (scorecard_overall, 0.20),
        (feedback_score, 0.20),
        (trust_signal, 0.10),
        (situational, 0.10),
    ]))

    by_game = defaultdict(lambda: {"minutes": 0, "sessions": 0, "ratings": [], "performance": []})
    for game in steam_library:
        name = game.get("gameName") or game.get("name") or "Steam game"
        key = game.get("gameSlug") or name.lower().replace(" ", "-")
        by_game[key]["gameSlug"] = key
        by_game[key]["gameName"] = name
        by_game[key]["minutes"] += max(0, safe_number(game.get("playtimeForeverMinutes") or game.get("totalMinutes"), 0))
    for session in sessions:
        key = session.get("gameSlug") or "unknown"
        by_game[key]["gameSlug"] = key
        by_game[key]["gameName"] = session.get("gameName") or by_game[key].get("gameName") or "Session"
        by_game[key]["minutes"] += max(0, safe_number(session.get("durationMinutes"), 0))
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
            "combat": clamp(average([entry.get("combat") for entry in performances], 0)),
            "support": clamp(average([entry.get("support") for entry in performances], 0)),
            "survival": clamp(average([entry.get("survival") for entry in performances], 0)),
            "objectiveFocus": clamp(average([entry.get("objectiveFocus") for entry in performances], 0)),
        }
        if performances:
            support_bias = performance["support"] - performance["combat"]
            role_signal = "Sentinel / Support" if support_bias >= 8 else "Entry / Impact" if performance["combat"] >= 76 else "Flex"
        else:
            role_signal = "Activity only"
        game_profiles.append({
            "gameSlug": item["gameSlug"],
            "gameName": item["gameName"],
            "minutes": round(item["minutes"]),
            "sessions": item["sessions"],
            "averageRating": clamp(average(item["ratings"], 0)),
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
            "score": clamp(average(values, 0)),
            "evidence": "Built from supplied scorecard signals.",
        }
        for key, values in signal_scores.items()
    ]
    if feedback_score is not None:
        strengths.append({"key": "teamSupport", "label": "Team support", "score": clamp(feedback_score), "evidence": "Based on teammate feedback."})
    if session_activity is not None:
        strengths.append({"key": "consistency", "label": "Consistency", "score": clamp(session_activity), "evidence": "Based on tracked ClutchQ sessions."})
    strengths = sorted(strengths, key=lambda item: item["score"], reverse=True)[:5]

    if scorecard_overall is None and feedback_score is None:
        main_style = "Profile still forming"
    elif feedback_score is not None and (scorecard_overall is None or feedback_score >= scorecard_overall):
        main_style = "Structured support"
    else:
        main_style = "Impact flex"
    if scorecard_overall is not None and feedback_score is not None and scorecard_overall >= 82 and feedback_score >= 82:
        main_style = "High-impact team anchor"
    best_squad_fit = "Ranked squad with clear roles and comms" if gameplay_score >= 70 else "Build more tracked sessions for a reliable squad fit"

    edge_data = {}

    def ensure_edge(user_id, name="ClutchQ teammate"):
        if not user_id or user_id == viewer_id:
            return None
        if user_id not in edge_data:
            edge_data[user_id] = {
                "userId": user_id,
                "name": name or "ClutchQ teammate",
                "lobbies": 0,
                "games": set(),
                "feedback": [],
            }
        elif name and edge_data[user_id]["name"] == "ClutchQ teammate":
            edge_data[user_id]["name"] = name
        return edge_data[user_id]

    for lobby in lobbies[:40]:
        for member in lobby.get("currentMembers") or []:
            member_user = member.get("userId") or member.get("_id")
            user_id = object_id(member_user)
            member_name = member_user.get("name") if isinstance(member_user, dict) else member.get("name")
            edge = ensure_edge(user_id, member_name)
            if edge is None:
                continue
            edge["lobbies"] += 1
            if lobby.get("game"):
                edge["games"].add(str(lobby.get("game")))

    for items, id_field in ((feedback, "fromUserId"), (feedback_given, "toUserId")):
        for item in items:
            user_id = object_id(item.get(id_field))
            edge = ensure_edge(user_id)
            rating = average((item.get("ratings") or {}).values())
            if edge is not None and rating is not None:
                edge["feedback"].append(rating * 20)

    teammate_edges = []
    for edge in edge_data.values():
        feedback_value = average(edge["feedback"])
        history_signal = min(70, 50 + max(0, edge["lobbies"] - 1) * 8) if edge["lobbies"] else None
        compatibility = clamp(weighted_average([(feedback_value, 0.8), (history_signal, 0.2)]))
        lobby_label = "lobby" if edge["lobbies"] == 1 else "lobbies"
        if feedback_value is not None:
            reason = "Based on teammate feedback"
            if edge["lobbies"]:
                reason += f" and {edge['lobbies']} completed shared {lobby_label}"
            reason += "."
        else:
            reason = f"{edge['lobbies']} completed shared {lobby_label}."
        teammate_edges.append({
            "userId": edge["userId"],
            "name": edge["name"],
            "compatibility": compatibility,
            "sharedGames": sorted(edge["games"])[:3],
            "reason": reason,
        })
    teammate_edges = sorted(teammate_edges, key=lambda item: item["compatibility"], reverse=True)[:80]

    recommendations = []
    if gameplay_score >= 70:
        recommendations.append("Your evidence supports structured squads with clear comms.")
    if strengths:
        recommendations.append(f"Look for teammates who complement {strengths[0]['label'].lower()}.")
    if not sessions:
        recommendations.append("Track a completed session to improve activity confidence.")
    if not scorecards:
        recommendations.append("Add structured match stats to unlock performance signals.")

    confidence = 0.0
    if sessions:
        confidence += 0.22
    if scorecards:
        confidence += 0.24
    if feedback:
        confidence += 0.2
    if steam_library:
        confidence += 0.14
    if achievements:
        confidence += 0.06

    return {
        "gameplayProfileScore": gameplay_score,
        "confidence": round(min(0.92, confidence), 2),
        "style": {
            "mainStyle": main_style,
            "competitiveTendency": clamp(weighted_average([(scorecard_overall, 0.6), (trust_signal, 0.4)])),
            "cooperativeTendency": clamp(weighted_average([(feedback_score, 0.7), (situational, 0.3)])),
            "riskProfile": "Balanced" if confidence >= 0.45 else "Not enough data",
            "bestSquadFit": best_squad_fit,
        },
        "gameProfiles": game_profiles,
        "situationalStrengths": strengths,
        "teammateEdges": teammate_edges,
        "recommendations": recommendations[:4],
    }


def compute_teammate_fit(payload):
    payload = payload or {}
    viewer_graph = payload.get("viewerGraph") or {}
    candidate_graphs = payload.get("candidateGraphs") or []
    candidate_profiles = payload.get("candidateProfiles") or []
    profile_by_user = {object_id(profile.get("userId") or profile.get("_id")): profile for profile in candidate_profiles}
    viewer_games = {item.get("gameName") for item in viewer_graph.get("gameProfiles") or [] if item.get("gameName")}
    edges = {object_id(item.get("userId")): item for item in viewer_graph.get("teammateEdges") or []}
    viewer_score = safe_number(viewer_graph.get("gameplayProfileScore"), None)
    viewer_confidence = safe_number(viewer_graph.get("confidence"), 0)
    matches = []

    for graph in candidate_graphs:
        user_id = object_id(graph.get("userId"))
        if not user_id:
            continue
        profile = profile_by_user.get(user_id, {})
        candidate_games = {item.get("gameName") for item in graph.get("gameProfiles") or [] if item.get("gameName")}
        shared_games = sorted([game for game in viewer_games.intersection(candidate_games) if game])
        game_overlap = None
        if viewer_games and candidate_games:
            game_overlap = min(100, len(shared_games) / max(1, min(len(viewer_games), len(candidate_games))) * 100)
        edge = edges.get(user_id)
        edge_score = safe_number(edge.get("compatibility"), None) if edge else None
        candidate_score = safe_number(graph.get("gameplayProfileScore"), None)
        graph_quality = average([viewer_score, candidate_score]) if viewer_score is not None and candidate_score is not None else None
        trust_score = safe_number(profile.get("trustScore"), None)
        evidence = [
            (game_overlap, 0.35),
            (edge_score, 0.25),
            (graph_quality, 0.25),
            (trust_score, 0.15),
        ]
        evidence_count = len([value for value, _ in evidence if value is not None])
        compatibility = clamp(weighted_average(evidence))
        candidate_confidence = safe_number(graph.get("confidence"), 0)
        confidence = min(0.9, min(viewer_confidence, candidate_confidence) + evidence_count * 0.08)

        reasons = []
        if shared_games:
            reasons.append("Shared game profile.")
        if edge:
            reasons.append(edge.get("reason") or "Previous teammate history.")
        if graph_quality is not None and graph_quality >= 75:
            reasons.append("Strong gameplay graph evidence.")
        if trust_score is not None and trust_score >= 80:
            reasons.append("Strong teammate trust signal.")

        warnings = []
        if evidence_count == 0:
            warnings.append("No shared evidence is available yet.")
        elif confidence < 0.45:
            warnings.append("Low confidence: limited shared history.")

        profile_user = profile.get("userId") if isinstance(profile.get("userId"), dict) else {}
        matches.append({
            "userId": user_id,
            "name": profile.get("displayName") or profile_user.get("name") or graph.get("name") or "ClutchQ player",
            "compatibility": compatibility,
            "confidence": round(confidence, 2),
            "sharedGames": shared_games[:3],
            "reasons": reasons[:3] or ["More shared activity is needed for a reliable match explanation."],
            "warnings": warnings,
        })

    return {"matches": sorted(matches, key=lambda item: item["compatibility"], reverse=True)[:12]}

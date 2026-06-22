from schemas import clamp, safe_number
from scorecard_parser import detect_game_type, normalize_manual_stats


def feedback_average(feedback, keys):
    values = [safe_number(feedback.get(key), None) for key in keys]
    values = [value for value in values if value is not None]
    if not values:
        return 70
    return sum(values) / len(values) * 20


def result_bonus(result):
    result = str(result or "").lower()
    if result == "win":
        return 10
    if result == "loss":
        return -4
    return 2


def analyze_scorecard(payload):
    payload = payload or {}
    game_slug = payload.get("gameSlug") or ""
    game_name = payload.get("gameName") or "Unknown game"
    game_type = detect_game_type(game_slug, game_name)
    stats = normalize_manual_stats(payload.get("manualStats"), payload.get("session"))
    feedback = payload.get("feedbackSummary") or {}
    steam = payload.get("steamContext") or {}
    session = payload.get("session") or {}

    kills = safe_number(stats.get("kills"), 0)
    deaths = max(0, safe_number(stats.get("deaths"), 0))
    assists = safe_number(stats.get("assists"), 0)
    damage = safe_number(stats.get("damage"), 0)
    placement = safe_number(stats.get("placement"), 0)
    score = safe_number(stats.get("score"), 0)
    duration = max(1, safe_number(stats.get("durationMinutes") or session.get("durationMinutes"), 1))
    rating = safe_number(session.get("matchRating"), 72)
    recent_minutes = safe_number(steam.get("recentGameMinutes"), 0)
    achievement_completion = safe_number(steam.get("achievementCompletion"), 0)

    support_feedback = feedback_average(feedback, ["communication", "teamwork", "reliability"])
    skill_feedback = feedback_average(feedback, ["skill", "behavior"])
    consistency_context = min(100, recent_minutes / 18 + achievement_completion * 0.35)

    if game_type == "battle_royale":
        placement_score = 88 if placement and placement <= 3 else 72 if placement and placement <= 10 else 52 if placement else 60
        combat = clamp(kills * 10 + damage / 70 + assists * 3)
        survival = clamp(placement_score + duration / 4)
        support = clamp(assists * 8 + safe_number(stats.get("revives"), 0) * 10 + support_feedback * 0.35)
        objective = clamp(placement_score + result_bonus(stats.get("result")) + score / 35)
        impact = clamp(combat * 0.5 + survival * 0.28 + objective * 0.22)
    elif game_type == "coop":
        combat = clamp(kills * 4 + damage / 120 + score / 50 + skill_feedback * 0.25)
        survival = clamp(75 + result_bonus(stats.get("result")) + max(0, 90 - deaths * 9) * 0.2)
        support = clamp(assists * 10 + support_feedback * 0.55 + safe_number(stats.get("revives"), 0) * 10)
        objective = clamp(80 + result_bonus(stats.get("result")) + score / 60)
        impact = clamp(support * 0.35 + objective * 0.35 + combat * 0.15 + survival * 0.15)
    else:
        kd_pressure = kills * 6 - deaths * 3
        combat = clamp(58 + kd_pressure + assists * 2.6 + damage / 110 + score / 18)
        survival = clamp(88 - deaths * 4 + duration / 6)
        support = clamp(assists * 7 + support_feedback * 0.42)
        objective = clamp(62 + result_bonus(stats.get("result")) + score / 20 + rating * 0.1)
        impact = clamp(combat * 0.55 + result_bonus(stats.get("result")) * 2 + score / 18 + rating * 0.18)

    consistency = clamp(rating * 0.48 + consistency_context * 0.26 + support_feedback * 0.26)
    overall = clamp(combat * 0.25 + survival * 0.14 + support * 0.18 + objective * 0.16 + consistency * 0.12 + impact * 0.15)

    summary = []
    if combat >= 75:
        summary.append("Strong combat impact.")
    if support >= 75:
        summary.append("Support contribution was stable.")
    if survival >= 75:
        summary.append("Good pressure handling.")
    if objective >= 75:
        summary.append("Objective contribution improved the match read.")
    if not summary:
        summary.append("Session saved enough signal for a baseline analysis.")

    confidence = 0.58
    if payload.get("scorecardMeta", {}).get("hasImage"):
        confidence += 0.08
    if kills or assists or score or damage or placement:
        confidence += 0.12
    if feedback:
        confidence += 0.1
    if recent_minutes:
        confidence += 0.06

    return {
        "detectedGame": game_name,
        "gameType": game_type,
        "extractedStats": stats,
        "performance": {
            "combat": combat,
            "survival": survival,
            "support": support,
            "objectiveFocus": objective,
            "consistency": consistency,
            "impact": impact,
            "overall": overall,
        },
        "situationalSignals": {
            "clutchPotential": clamp(impact * 0.55 + survival * 0.45),
            "entryPressure": clamp(combat * 0.82 + kills * 2),
            "teamSupport": support,
            "objectiveFocus": objective,
            "pressureHandling": clamp(survival * 0.5 + consistency * 0.5),
            "tiltResistance": clamp(consistency * 0.7 + support_feedback * 0.3),
        },
        "summary": summary[:3],
        "warnings": [],
        "confidence": round(min(0.94, confidence), 2),
    }

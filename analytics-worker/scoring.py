from schemas import clamp, safe_number
from scorecard_parser import detect_game_type, normalize_manual_stats


def known_average(values):
    clean = [safe_number(value, None) for value in values]
    clean = [value for value in clean if value is not None]
    return sum(clean) / len(clean) if clean else None


def weighted_average(items):
    known = [(value, weight) for value, weight in items if value is not None]
    if not known:
        return None
    total_weight = sum(weight for _, weight in known)
    return sum(value * weight for value, weight in known) / total_weight


def feedback_average(feedback, keys):
    value = known_average([feedback.get(key) for key in keys])
    return value * 20 if value is not None else None


def result_bonus(result):
    result = str(result or "").lower()
    if result in {"win", "won"}:
        return 10
    if result in {"loss", "lost"}:
        return -4
    return 0


def output_score(value):
    return clamp(value) if value is not None else 0


def analyze_scorecard(payload):
    payload = payload or {}
    game_slug = payload.get("gameSlug") or ""
    game_name = payload.get("gameName") or "Unknown game"
    game_type = detect_game_type(game_slug, game_name)
    stats = normalize_manual_stats(payload.get("manualStats"), payload.get("session"))
    feedback = payload.get("feedbackSummary") or {}
    steam = payload.get("steamContext") or {}
    session = payload.get("session") or {}

    kills = safe_number(stats.get("kills"), None)
    deaths = safe_number(stats.get("deaths"), None)
    assists = safe_number(stats.get("assists"), None)
    damage = safe_number(stats.get("damage"), None)
    placement = safe_number(stats.get("placement"), None)
    score = safe_number(stats.get("score"), None)
    revives = safe_number(stats.get("revives"), None)
    duration = safe_number(stats.get("durationMinutes") or session.get("durationMinutes"), None)
    rating = safe_number(session.get("matchRating"), None)
    recent_minutes = safe_number(steam.get("recentGameMinutes"), 0)
    achievement_completion = safe_number(steam.get("achievementCompletion"), 0)
    known_result = str(stats.get("result") or "").lower() in {"win", "won", "loss", "lost"}
    bonus = result_bonus(stats.get("result"))

    support_feedback = feedback_average(feedback, ["communication", "teamwork", "reliability"])
    skill_feedback = feedback_average(feedback, ["skill", "behavior"])
    steam_context = None
    if recent_minutes > 0 or achievement_completion > 0:
        steam_context = clamp(recent_minutes / 18 + achievement_completion * 0.35)

    combat_inputs = [kills, deaths, assists, damage, score]
    has_combat = any(value is not None for value in combat_inputs)
    combat = None
    if has_combat:
        kill_value = max(0, kills or 0)
        death_value = max(0, deaths or 0)
        assist_value = max(0, assists or 0)
        damage_value = max(0, damage or 0)
        score_value = max(0, score or 0)
        multiplier = 8 if game_type == "battle_royale" else 5 if game_type == "coop" else 6
        combat = clamp(18 + kill_value * multiplier - death_value * 3 + assist_value * 2.5 + damage_value / 110 + score_value / 30)

    survival = None
    if deaths is not None or duration is not None or placement is not None or known_result:
        death_value = max(0, deaths or 0)
        duration_value = max(0, duration or 0)
        placement_value = max(0, placement or 0)
        placement_signal = 0
        if placement_value:
            placement_signal = 38 if placement_value <= 3 else 24 if placement_value <= 10 else 10
        survival = clamp(38 - death_value * 5 + min(24, duration_value / 5) + placement_signal + bonus)

    support = None
    if assists is not None or revives is not None or support_feedback is not None:
        support = clamp((assists or 0) * 8 + (revives or 0) * 12 + (support_feedback or 0) * 0.55)

    objective = None
    if score is not None or placement is not None or known_result:
        placement_value = max(0, placement or 0)
        placement_signal = 35 if placement_value and placement_value <= 3 else 20 if placement_value and placement_value <= 10 else 0
        objective = clamp((score or 0) / 22 + placement_signal + 42 + bonus)

    consistency = weighted_average([
        (rating, 0.45),
        (steam_context, 0.25),
        (support_feedback, 0.20),
        (skill_feedback, 0.10),
    ])
    if consistency is not None:
        consistency = clamp(consistency)

    impact = weighted_average([
        (combat, 0.45),
        (objective, 0.25),
        (survival, 0.15),
        (support, 0.15),
    ])
    if impact is not None:
        impact = clamp(impact + (bonus if known_result else 0))

    overall = weighted_average([
        (combat, 0.25),
        (survival, 0.14),
        (support, 0.18),
        (objective, 0.16),
        (consistency, 0.12),
        (impact, 0.15),
    ])
    overall = output_score(overall)

    performance = {
        "combat": output_score(combat),
        "survival": output_score(survival),
        "support": output_score(support),
        "objectiveFocus": output_score(objective),
        "consistency": output_score(consistency),
        "impact": output_score(impact),
        "overall": overall,
    }

    summary = []
    if combat is not None and combat >= 75:
        summary.append("Strong combat impact in the supplied stats.")
    if support is not None and support >= 75:
        summary.append("Support contribution was strong.")
    if survival is not None and survival >= 75:
        summary.append("Good pressure handling in this session.")
    if objective is not None and objective >= 75:
        summary.append("Objective contribution improved the match read.")
    if not summary and any(value is not None for value in [combat, survival, support, objective, consistency]):
        summary.append("Analysis is based only on the structured signals supplied for this session.")
    if not summary:
        summary.append("Not enough measurable gameplay data was supplied for a performance score.")

    warnings = []
    scorecard_meta = payload.get("scorecardMeta") or {}
    if scorecard_meta.get("hasImage") and not scorecard_meta.get("ocrText"):
        warnings.append("Image OCR is not configured; the image itself was not used to calculate scores.")
    if not any(value is not None for value in [combat, survival, support, objective, consistency]):
        warnings.append("Add structured match stats, a rating, or teammate feedback to calculate performance.")

    confidence = 0.0
    if has_combat or placement is not None or score is not None:
        confidence += 0.42
    if rating is not None or known_result or duration is not None:
        confidence += 0.14
    if support_feedback is not None or skill_feedback is not None:
        confidence += 0.18
    if steam_context is not None:
        confidence += 0.1

    return {
        "detectedGame": game_name,
        "gameType": game_type,
        "extractedStats": stats,
        "performance": performance,
        "situationalSignals": {
            "clutchPotential": output_score(weighted_average([(impact, 0.55), (survival, 0.45)])),
            "entryPressure": output_score(combat),
            "teamSupport": output_score(support),
            "objectiveFocus": output_score(objective),
            "pressureHandling": output_score(weighted_average([(survival, 0.5), (consistency, 0.5)])),
            "tiltResistance": output_score(weighted_average([(consistency, 0.7), (support_feedback, 0.3)])),
        },
        "summary": summary[:3],
        "warnings": warnings,
        "confidence": round(min(0.92, confidence), 2),
    }

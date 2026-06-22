from schemas import clean_text, safe_number


FPS_SLUGS = {"valorant", "cs2", "counter-strike-2", "apex-legends", "fortnite", "escape-from-tarkov"}
BATTLE_ROYALE_SLUGS = {"bgmi", "pubg", "pubg-mobile", "free-fire", "fortnite", "apex-legends"}
COOP_SLUGS = {"lethal-company", "helldivers-2", "minecraft", "fall-guys", "among-us", "phasmophobia"}


def detect_game_type(game_slug="", game_name=""):
    slug = clean_text(game_slug).lower()
    name = clean_text(game_name).lower()

    if slug in BATTLE_ROYALE_SLUGS or any(term in name for term in ["bgmi", "pubg", "free fire", "battle royale"]):
        return "battle_royale"
    if slug in COOP_SLUGS or any(term in name for term in ["co-op", "coop", "lethal", "helldivers", "minecraft"]):
        return "coop"
    if slug in FPS_SLUGS or any(term in name for term in ["valorant", "counter-strike", "fps", "shooter"]):
        return "fps"
    return "general"


def normalize_manual_stats(manual_stats=None, session=None):
    manual_stats = manual_stats or {}
    session = session or {}
    stats = {
        "kills": safe_number(manual_stats.get("kills"), None),
        "deaths": safe_number(manual_stats.get("deaths"), None),
        "assists": safe_number(manual_stats.get("assists"), None),
        "damage": safe_number(manual_stats.get("damage"), None),
        "placement": safe_number(manual_stats.get("placement"), None),
        "score": safe_number(manual_stats.get("score"), None),
        "revives": safe_number(manual_stats.get("revives"), None),
        "result": clean_text(manual_stats.get("result") or session.get("result") or "completed"),
        "durationMinutes": safe_number(manual_stats.get("durationMinutes") or session.get("durationMinutes"), 0),
    }
    return stats

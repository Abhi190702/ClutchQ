import os
import sys
import unittest


WORKER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKER_ROOT not in sys.path:
    sys.path.insert(0, WORKER_ROOT)

from gameplay_graph import compute_teammate_fit, rebuild_gameplay_graph
from rhythm import build_rhythm
from scoring import analyze_scorecard


class AnalyticsIntegrityTests(unittest.TestCase):
    def test_empty_scorecard_does_not_invent_performance(self):
        result = analyze_scorecard({"gameName": "Valorant"})
        self.assertEqual(result["performance"]["overall"], 0)
        self.assertEqual(result["performance"]["combat"], 0)
        self.assertEqual(result["confidence"], 0)
        self.assertTrue(result["warnings"])

    def test_lifetime_steam_time_is_not_dated_recent_activity(self):
        result = build_rhythm({
            "steamLibrary": [{
                "name": "Old Game",
                "playtimeForeverMinutes": 9000,
                "playtimeLastTwoWeeksMinutes": 0,
            }]
        })
        self.assertEqual(len(result["series"]), 56)
        self.assertEqual(result["summary"]["totalMinutes"], 0)
        self.assertEqual(result["summary"]["rhythmScore"], 0)
        self.assertEqual(result["gameMix"], [])
        self.assertEqual(result["confidence"], 0)

    def test_empty_gameplay_graph_has_zero_score_and_no_fake_strengths(self):
        result = rebuild_gameplay_graph({})
        self.assertEqual(result["gameplayProfileScore"], 0)
        self.assertEqual(result["confidence"], 0)
        self.assertEqual(result["situationalStrengths"], [])
        self.assertEqual(result["style"]["mainStyle"], "Profile still forming")

    def test_teammate_fit_accepts_string_user_ids_without_fake_compatibility(self):
        result = compute_teammate_fit({
            "viewerGraph": {},
            "candidateGraphs": [{"userId": "candidate-1", "confidence": 0.1}],
            "candidateProfiles": [{"userId": "candidate-1", "displayName": "Candidate"}],
        })
        self.assertEqual(result["matches"][0]["compatibility"], 0)
        self.assertEqual(result["matches"][0]["confidence"], 0)
        self.assertIn("No shared evidence", result["matches"][0]["warnings"][0])

    def test_gameplay_graph_edges_use_completed_history_and_feedback(self):
        viewer = "507f1f77bcf86cd799439011"
        teammate = "507f191e810c19729de860ea"
        result = rebuild_gameplay_graph({
            "user": {"_id": viewer},
            "lobbies": [
                {"game": "Valorant", "currentMembers": [{"userId": {"_id": viewer}}, {"userId": {"_id": teammate, "name": "Teammate"}}]},
                {"game": "CS2", "currentMembers": [{"userId": {"_id": viewer}}, {"userId": {"_id": teammate, "name": "Teammate"}}]},
            ],
            "feedbackReceived": [{"fromUserId": teammate, "ratings": {"communication": 4, "teamwork": 4}}],
        })

        self.assertEqual(len(result["teammateEdges"]), 1)
        self.assertEqual(result["teammateEdges"][0]["userId"], teammate)
        self.assertEqual(result["teammateEdges"][0]["compatibility"], 76)
        self.assertEqual(result["teammateEdges"][0]["sharedGames"], ["CS2", "Valorant"])
        self.assertEqual(
            result["teammateEdges"][0]["reason"],
            "Based on teammate feedback and 2 completed shared lobbies.",
        )


if __name__ == "__main__":
    unittest.main()

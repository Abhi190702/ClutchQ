import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import ScoreRing from "../common/ScoreRing";
import Badge from "../common/Badge";
import { useToast } from "../../context/ToastContext";

const FindSquadNow = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post("/matchmaking/find-squad-now");
      setResult(response.data.data);
      showToast("Best squad found");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quick squad suggestion</h3>
          <p className="mt-1 text-sm text-clutch-muted">Find the best players and lobby from your current profile.</p>
        </div>
        <button type="button" disabled={loading} onClick={run} className="btn-primary">
          {loading ? "Finding..." : "Find squad"}
        </button>
      </div>

      {loading && (
        <div className="mt-5 rounded-md border border-clutch-blue/30 bg-clutch-blue/10 p-4">
          <div className="h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
            <div className="h-full w-2/3 animate-pulseLine rounded-full bg-clutch-blue" />
          </div>
          <div className="mt-3 text-sm text-blue-100">Comparing rank, role, trust, and availability...</div>
        </div>
      )}

      {result && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr]">
          <ScoreRing score={result.squadCompatibilityScore} label="Squad" />
          <div className="rounded-md border border-clutch-border bg-clutch-panelSoft p-4">
            <div className="text-sm font-semibold text-clutch-blue">Best squad found</div>
            <h4 className="mt-1 text-xl font-semibold">Squad compatibility: {result.squadCompatibilityScore}%</h4>
            <div className="mt-3 grid gap-2 text-sm text-clutch-muted">
              <div>Your strongest match: <span className="font-bold text-clutch-text">{result.strongestMatch?.displayName || "Direct invite"}</span></div>
              <div>Best open lobby: <span className="font-bold text-clutch-text">{result.bestOpenLobby?.lobby?.title || "No lobby beats direct squad"}</span></div>
              <div>Recommended action: <span className="font-bold text-clutch-blue">{result.recommendedAction}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.whySelected?.map((why) => <Badge key={why}>{why}</Badge>)}
              {result.missingRoles?.map((role) => <Badge key={role} tone="border-clutch-amber/40 bg-clutch-amber/10 text-amber-100">Missing {role}</Badge>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindSquadNow;

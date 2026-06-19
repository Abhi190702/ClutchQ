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
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
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
          <h3 className="text-xl font-black">Find Squad Now</h3>
          <p className="mt-1 text-sm text-clutch-muted">One click scans players, lobbies, role gaps, and chemistry.</p>
        </div>
        <button type="button" disabled={loading} onClick={run} className="btn-primary">
          {loading ? "Scanning squad signals..." : "Find Squad Now"}
        </button>
      </div>

      {loading && (
        <div className="mt-5 rounded-lg border border-clutch-cyan/30 bg-clutch-cyan/10 p-4">
          <div className="h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
            <div className="h-full w-2/3 animate-pulseLine rounded-full bg-clutch-cyan" />
          </div>
          <div className="mt-3 text-sm text-cyan-100">Comparing rank, role, trust, and availability...</div>
        </div>
      )}

      {result && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr]">
          <ScoreRing score={result.squadCompatibilityScore} label="Squad" />
          <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
            <div className="text-sm font-bold text-clutch-cyan">Best Squad Found</div>
            <h4 className="mt-1 text-xl font-black">Squad Compatibility: {result.squadCompatibilityScore}%</h4>
            <div className="mt-3 grid gap-2 text-sm text-clutch-muted">
              <div>Your strongest match: <span className="font-bold text-clutch-text">{result.strongestMatch?.displayName || "Direct invite"}</span></div>
              <div>Best open lobby: <span className="font-bold text-clutch-text">{result.bestOpenLobby?.lobby?.title || "No lobby beats direct squad"}</span></div>
              <div>Recommended action: <span className="font-bold text-clutch-cyan">{result.recommendedAction}</span></div>
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

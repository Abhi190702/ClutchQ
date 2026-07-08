import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import Badge from "../common/Badge";
import DetailDrawer from "../common/DetailDrawer";
import { useToast } from "../../context/ToastContext";

const FindSquadNow = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  const run = async () => {
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const response = await api.post("/matchmaking/find-squad-now");
      setResult(response.data.data);
      showToast("Best squad found");
    } catch (error) {
      const message = getErrorMessage(error) || "Could not find squad suggestions.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex flex-col gap-5">
        <div>
          <div className="eyebrow mb-2">Squad engine</div>
          <h3 className="text-2xl font-black tracking-tight">Quick squad suggestion</h3>
          <p className="mt-2 text-sm leading-6 text-clutch-muted">Find the best players and lobby from your current profile.</p>
        </div>
        <button type="button" disabled={loading} onClick={run} className="btn-primary rounded-2xl py-3">
          {loading ? "Finding..." : "Find squad"}
        </button>
      </div>

      {loading && (
        <div className="mt-6 rounded-2xl border border-clutch-blue/25 bg-clutch-blue/10 p-4">
          <div className="h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
            <div className="h-full w-2/3 animate-pulseLine rounded-full bg-clutch-blue" />
          </div>
          <div className="mt-3 text-sm text-blue-100">Comparing rank, role, trust, and availability...</div>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-clutch-red/30 bg-clutch-red/10 p-3 text-sm text-red-100">
          <span>{error}</span>
          <button type="button" className="ml-3 font-bold underline" onClick={run}>
            Retry
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="mt-6 rounded-[24px] bg-black/20 p-4 ring-1 ring-white/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-clutch-blue">Best squad found</div>
                <h4 className="mt-1 text-xl font-black text-white">{result.squadCompatibilityScore}% squad compatibility</h4>
                <p className="mt-2 text-sm leading-6 text-clutch-muted">
                  Strongest match: <span className="font-bold text-clutch-text">{result.strongestMatch?.displayName || "Direct invite"}</span>
                </p>
              </div>
              <button type="button" className="btn-secondary rounded-2xl" onClick={() => setOpen(true)}>
                Why this squad?
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(result.whySelected || []).slice(0, 2).map((why) => <Badge key={why}>{why}</Badge>)}
              {result.recommendedAction ? <Badge>{result.recommendedAction}</Badge> : null}
            </div>
          </div>
          <DetailDrawer
            open={open}
            onClose={() => setOpen(false)}
            title="Squad engine explanation"
            subtitle={`Compatibility ${result.squadCompatibilityScore}% · ${result.recommendedAction || "Recommended action ready"}`}
          >
            <div className="space-y-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Best open lobby</div>
                <p className="mt-2 text-base font-bold text-white">{result.bestOpenLobby?.lobby?.title || "No lobby beats direct squad building"}</p>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Why selected</div>
                <div className="mt-3 space-y-2">
                  {(result.whySelected || []).map((why) => (
                    <p key={why} className="rounded-[12px] bg-white/[0.04] px-3 py-2 text-sm leading-6 text-zinc-300">{why}</p>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Role gaps</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.missingRoles?.length ? result.missingRoles.map((role) => (
                    <Badge key={role} tone="border-clutch-amber/40 bg-clutch-amber/10 text-amber-100">Missing {role}</Badge>
                  )) : <Badge>Role balance stable</Badge>}
                </div>
              </div>
            </div>
          </DetailDrawer>
        </>
      )}
    </section>
  );
};

export default FindSquadNow;

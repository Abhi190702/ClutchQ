import { useMemo, useState } from "react";
import { getErrorMessage } from "../../services/api";
import intelligenceApi from "../../services/intelligenceApi";
import AnalysisResultCard from "./AnalysisResultCard";
import ScorecardStatsEditor from "./ScorecardStatsEditor";
import ScorecardUploader from "./ScorecardUploader";
import TeammateFeedbackForm from "./TeammateFeedbackForm";

const steps = ["Summary", "Scorecard", "Stats", "Feedback", "Analysis"];
const normalizeNumber = (raw) => {
  if (raw === "") return "";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : "";
};

const MatchWrapUpModal = ({ session, teammates = [], onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [scorecard, setScorecard] = useState(null);
  const [stats, setStats] = useState({
    result: session?.result || "completed",
    durationMinutes: session?.durationMinutes || "",
    kills: "",
    deaths: "",
    assists: "",
    damage: "",
    placement: "",
    score: ""
  });
  const [feedback, setFeedback] = useState({ toUserId: "", ratings: { communication: 4, teamwork: 4, reliability: 4, skill: 4, behavior: 4 }, wouldPlayAgain: "yes", comment: "" });
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const normalizedTeammates = useMemo(
    () => teammates.map((item) => ({ ...item, id: item.userId || item.id })),
    [teammates]
  );

  const runAnalysis = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await intelligenceApi.uploadScorecard({
        sessionId: session?._id,
        gameSlug: session?.gameSlug,
        gameName: session?.gameName,
        imageDataUrl: scorecard?.dataUrl,
        manualStats: stats
      });
      setAnalysis(response.data.data);
      setStep(4);
      onComplete?.();
    } catch (analysisError) {
      setError(getErrorMessage(analysisError));
    } finally {
      setBusy(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedback.toUserId || !session?._id) {
      return runAnalysis();
    }

    setBusy(true);
    setError("");
    try {
      await intelligenceApi.submitSessionFeedback(session._id, feedback);
      await runAnalysis();
    } catch (feedbackError) {
      setError(getErrorMessage(feedbackError));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-0 sm:place-items-center sm:p-4">
      <div className="thin-scrollbar max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-[22px] border border-[#33333a] bg-[#1d1d21] p-5 shadow-2xl sm:rounded-[14px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Match wrap-up</div>
            <h2 className="mt-2 text-3xl font-black text-white">{session?.gameName || "Finished session"}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Upload a scorecard, confirm stats, and optionally rate a teammate. Every step is skippable.</p>
          </div>
          <button type="button" className="btn-secondary py-2" onClick={onClose}>Close</button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-black ${step === index ? "bg-white text-black" : "bg-white/[0.06] text-zinc-400"}`}
              onClick={() => setStep(index)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        {error ? <div className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

        <div className="mt-5 space-y-4">
          {step === 0 && (
            <div className="rounded-[12px] border border-white/10 bg-white/[0.025] p-4">
              <div className="text-sm font-black text-white">Match summary</div>
              <p className="mt-1 text-sm text-zinc-400">Start with the basic result. Scorecard and teammate feedback stay optional.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="form-label">Result</span>
                  <select className="form-input" value={stats.result || "completed"} onChange={(event) => setStats({ ...stats, result: event.target.value })}>
                    <option value="completed">Completed</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                <label>
                  <span className="form-label">Duration minutes</span>
                  <input className="form-input" type="number" min="0" value={stats.durationMinutes ?? ""} onChange={(event) => setStats({ ...stats, durationMinutes: normalizeNumber(event.target.value) })} />
                </label>
              </div>
            </div>
          )}
          {step === 1 && <ScorecardUploader value={scorecard} onChange={setScorecard} />}
          {step === 2 && <ScorecardStatsEditor value={stats} onChange={setStats} gameName={session?.gameName || session?.gameSlug} />}
          {step === 3 && <TeammateFeedbackForm teammates={normalizedTeammates} value={feedback} onChange={setFeedback} />}
          {step === 4 && (
            analysis ? <AnalysisResultCard result={analysis} /> : (
              <div className="rounded-[10px] border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-300">
                Ready to generate scorecard analysis from session, stats, feedback, and Steam context.
                {error ? <button type="button" className="mt-3 block font-bold text-clutch-blue" onClick={runAnalysis} disabled={busy}>Retry analysis</button> : null}
              </div>
            )
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button type="button" className="btn-secondary" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || busy}>
            Back
          </button>
          <div className="flex flex-wrap gap-3">
            {step < 3 ? (
              <>
                <button type="button" className="btn-secondary" onClick={() => setStep((value) => value + 1)}>Skip</button>
                <button type="button" className="btn-primary" onClick={() => setStep((value) => value + 1)}>Continue</button>
              </>
            ) : null}
            {step === 3 ? (
              <>
                <button type="button" className="btn-secondary" onClick={runAnalysis} disabled={busy}>Skip feedback</button>
                <button type="button" className="btn-primary" onClick={submitFeedback} disabled={busy}>{busy ? "Saving..." : "Save and analyze"}</button>
              </>
            ) : null}
            {step === 4 ? (
              <button type="button" className="btn-primary" onClick={analysis ? onClose : runAnalysis} disabled={busy}>
                {analysis ? "Done" : busy ? "Generating..." : "Generate analysis"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchWrapUpModal;

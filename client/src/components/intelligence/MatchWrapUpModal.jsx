import { useMemo, useState } from "react";
import { getErrorMessage } from "../../services/api";
import intelligenceApi from "../../services/intelligenceApi";
import AnalysisResultCard from "./AnalysisResultCard";
import ScorecardStatsEditor from "./ScorecardStatsEditor";
import ScorecardUploader from "./ScorecardUploader";
import TeammateFeedbackForm from "./TeammateFeedbackForm";

const steps = ["Scorecard", "Stats", "Feedback", "Analysis"];

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
      setStep(3);
      onComplete?.();
    } catch (analysisError) {
      setError(getErrorMessage(analysisError));
    } finally {
      setBusy(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedback.toUserId || !session?._id) {
      setStep(3);
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
      <div className="thin-scrollbar max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[14px] border border-[#33333a] bg-[#1d1d21] p-5 shadow-2xl">
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
          {step === 0 && <ScorecardUploader value={scorecard} onChange={setScorecard} />}
          {step === 1 && <ScorecardStatsEditor value={stats} onChange={setStats} />}
          {step === 2 && <TeammateFeedbackForm teammates={normalizedTeammates} value={feedback} onChange={setFeedback} />}
          {step === 3 && (
            analysis ? <AnalysisResultCard result={analysis} /> : (
              <div className="rounded-[10px] border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-300">
                Ready to generate scorecard analysis from session, stats, feedback, and Steam context.
              </div>
            )
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button type="button" className="btn-secondary" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || busy}>
            Back
          </button>
          <div className="flex flex-wrap gap-3">
            {step < 2 ? (
              <>
                <button type="button" className="btn-secondary" onClick={() => setStep((value) => value + 1)}>Skip</button>
                <button type="button" className="btn-primary" onClick={() => setStep((value) => value + 1)}>Continue</button>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <button type="button" className="btn-secondary" onClick={runAnalysis} disabled={busy}>Skip feedback</button>
                <button type="button" className="btn-primary" onClick={submitFeedback} disabled={busy}>{busy ? "Saving..." : "Save and analyze"}</button>
              </>
            ) : null}
            {step === 3 ? (
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

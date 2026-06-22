import { useEffect, useMemo, useState } from "react";

const formatElapsed = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
};

const ActiveSessionTimer = ({ activity, onEnd }) => {
  const [now, setNow] = useState(Date.now());
  const started = useMemo(() => {
    if (!activity?.startedAt) return Date.now();
    const time = new Date(activity.startedAt).getTime();
    return Number.isFinite(time) ? time : Date.now();
  }, [activity?.startedAt]);

  useEffect(() => {
    if (!activity) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activity]);

  if (!activity) return null;

  return (
    <div className="rounded-[10px] border border-sky-400/30 bg-[#202024] p-5">
      <div className="text-sm font-bold text-sky-300">Currently Playing</div>
      <div className="mt-2 text-2xl font-black text-white">{activity.gameName}</div>
      <div className="mt-4 text-4xl font-black tabular-nums text-white">{formatElapsed(Math.max(0, Math.floor((now - started) / 1000)))}</div>
      <button type="button" className="btn-primary mt-5" onClick={() => onEnd?.(activity)}>
        End Match
      </button>
    </div>
  );
};

export default ActiveSessionTimer;

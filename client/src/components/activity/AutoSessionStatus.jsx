import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const pad = (value) => String(value).padStart(2, "0");

const formatElapsed = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

// Replaces the old manual "Start Session" control. Sessions are started and
// counted automatically when a player joins a game room, so this simply
// reflects the live state: a ticking timer while tracking, or a hint otherwise.
const AutoSessionStatus = ({ active, variant = "inline" }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  if (active) {
    const elapsed = formatElapsed(now - new Date(active.startedAt).getTime());
    return (
      <div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-clutch-green">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clutch-green/70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-clutch-green" />
          </span>
          Auto-tracking live
        </div>
        <div className="mt-3 font-mono text-4xl font-black tabular-nums text-white">{elapsed}</div>
        <div className="mt-1 text-sm text-zinc-400">
          Counting <span className="font-bold text-zinc-200">{active.gameName}</span> minutes automatically. Leaving the room saves it.
        </div>
      </div>
    );
  }

  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
        Auto session tracking
      </div>
      <div className="mt-3 text-lg font-black text-white">Sessions track themselves</div>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Join a game room and ClutchQ automatically starts counting your minutes and hours — no manual start. Your gaming rhythm updates on its own.
      </p>
      <Link to="/games" className="btn-secondary mt-4 inline-flex py-2">
        Find a room to join
      </Link>
    </>
  );

  if (variant === "panel") {
    return <div className="premium-panel p-5">{body}</div>;
  }
  return <div>{body}</div>;
};

export default AutoSessionStatus;

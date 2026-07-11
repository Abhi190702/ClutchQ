import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import DetailDrawer from "../common/DetailDrawer";
import RankBadge from "../common/RankBadge";
import ScoreRing from "../common/ScoreRing";
import TrustBadge from "../common/TrustBadge";
import MatchBreakdown from "./MatchBreakdown";
import MatchConfidence from "./MatchConfidence";
import { getPrimaryGame } from "../../utils/rankLogic";
import { initials } from "../../utils/formatters";
import { getGameArt } from "../../utils/gameArt";

const PlayerCard = ({ item, onSendRequest, requested = false, featured = false }) => {
  const [open, setOpen] = useState(false);
  const profile = item?.profile;
  const match = item?.match;
  const game = getPrimaryGame(profile);
  const rolesText = game?.roles?.slice(0, 2).join(", ") || "Flexible role";
  const gameArt = getGameArt(game?.gameName);
  const visibleBadges = [
    ...(profile?.badges || []),
    profile?.micAvailable ? "Mic Ready" : null
  ].filter(Boolean).slice(0, 2);

  return (
    <article className={`group relative overflow-hidden rounded-[34px] px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(0,0,0,0.34)] md:px-7 ${featured ? "bg-[linear-gradient(115deg,rgba(61,187,250,0.095),rgba(255,255,255,0.025)_44%,rgba(55,216,164,0.045))] ring-clutch-blue/25" : "bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.016))] ring-white/10 hover:ring-white/15"}`}>
      {featured ? <div className="pointer-events-none absolute bottom-8 left-0 top-8 w-1 rounded-r-full bg-clutch-blue" /> : null}
      {gameArt ? (
        <>
          <img
            src={gameArt}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute inset-y-[-40%] right-[-5%] h-[180%] w-[44%] scale-110 rounded-[36px] object-cover opacity-[0.2] blur-lg saturate-150 transition duration-500 group-hover:opacity-[0.3]"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#0d0f14_0%,rgba(13,15,20,0.93)_48%,rgba(13,15,20,0.58)_100%)]" />
        </>
      ) : null}
      <div className="relative grid gap-6 xl:grid-cols-[minmax(300px,1.1fr)_minmax(190px,0.58fr)_minmax(210px,0.45fr)] xl:items-center">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[24px] bg-white/[0.055] text-lg font-black text-clutch-blue shadow-[0_14px_34px_rgba(0,0,0,0.25)] ring-1 ring-white/10">
            {initials(profile?.displayName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-black tracking-tight text-clutch-text">{profile?.displayName}</h3>
              {featured ? <span className="rounded-full border border-clutch-blue/25 bg-clutch-blue/10 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-clutch-blue">Best fit</span> : null}
            </div>
            <p className="mt-2 flex items-center gap-2 truncate text-sm text-clutch-muted">
              {gameArt ? (
                <span className="h-7 w-7 shrink-0 overflow-hidden rounded-[9px] bg-clutch-panel shadow-[0_6px_16px_rgba(0,0,0,0.35)] ring-1 ring-white/15" title={game?.gameName || "Primary game"}>
                  <img src={gameArt} alt={`${game?.gameName || "Game"} icon`} className="h-full w-full object-cover" loading="lazy" />
                </span>
              ) : null}
              <span className="font-bold text-zinc-300">{game?.gameName || "Game profile"}</span>
              <span className="text-zinc-700">/</span>
              <span className="truncate">{rolesText}</span>
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <RankBadge rank={game?.rank} />
              <TrustBadge score={profile?.trustScore} />
              {profile?.region ? <Badge>{profile.region}</Badge> : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-center">
          <MatchConfidence confidence={match?.confidence} />
          {visibleBadges.map((badge) => <Badge key={badge}>{badge}</Badge>)}
        </div>

        <div className="flex items-center justify-between gap-4 xl:justify-end">
          <ScoreRing score={match?.totalScore} size={72} label="Match" />
          <div className="flex min-w-[140px] flex-col gap-2">
            <button type="button" className="btn-primary rounded-2xl px-5 py-2.5" disabled={requested} onClick={() => onSendRequest?.(profile)}>
              {requested ? "Request Sent" : "Send Request"}
            </button>
            <div className="flex items-center justify-center gap-4">
              <Link to={`/player/${profile?._id}`} className="text-sm font-bold text-clutch-text transition hover:text-clutch-blue">
                Profile
              </Link>
              <button type="button" className="text-sm font-bold text-clutch-muted transition hover:text-clutch-text" onClick={() => setOpen((current) => !current)}>
                Why?
              </button>
            </div>
          </div>
        </div>
      </div>

      <DetailDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={`Why ${profile?.displayName || "this player"} fits`}
        subtitle={`${game?.gameName || "Primary game"} · ${match?.totalScore ?? 0}% match`}
      >
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="border-l border-white/10 pl-3">
            <div className="text-2xl font-black text-white">{profile?.reliabilityScore != null ? `${profile.reliabilityScore}%` : "Building"}</div>
            <div className="text-xs font-semibold text-zinc-500">Reliability</div>
          </div>
          <div className="border-l border-white/10 pl-3">
            <div className="text-2xl font-black text-white">{match?.availability?.overlapHours ?? 0}h</div>
            <div className="text-xs font-semibold text-zinc-500">Overlap</div>
          </div>
        </div>
        <div className="mb-5">
          <MatchConfidence confidence={match?.confidence} />
        </div>
        <div className="border-t border-white/10 pt-4">
          <MatchBreakdown match={match} />
        </div>
        <div className="mt-5 rounded-[12px] border border-white/10 bg-white/[0.025] p-3">
          <div className="text-sm font-black text-white">Next action</div>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Send a request if rank, role, and timing still feel right. ClutchQ will keep improving this explanation as more sessions and feedback come in.
          </p>
        </div>
      </DetailDrawer>
    </article>
  );
};

export default PlayerCard;

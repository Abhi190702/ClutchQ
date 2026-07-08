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

const PlayerCard = ({ item, onSendRequest, requested = false }) => {
  const [open, setOpen] = useState(false);
  const profile = item?.profile;
  const match = item?.match;
  const game = getPrimaryGame(profile);
  const visibleBadges = [
    ...(profile?.badges || []),
    profile?.micAvailable ? "Mic Ready" : null
  ].filter(Boolean).slice(0, 2);

  return (
    <article className="group rounded-[28px] p-5 transition hover:bg-white/[0.028] hover:ring-1 hover:ring-white/10">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/[0.055] text-lg font-bold text-clutch-blue ring-1 ring-white/10">
            {initials(profile?.displayName)}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black tracking-tight text-clutch-text">{profile?.displayName}</h3>
            <p className="mt-1 truncate text-sm text-clutch-muted">{game?.gameName} - {game?.roles?.slice(0, 2).join(", ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <RankBadge rank={game?.rank} />
              <TrustBadge score={profile?.trustScore} />
              {profile?.region ? <Badge>{profile.region}</Badge> : null}
            </div>
          </div>
        </div>
        <ScoreRing score={match?.totalScore} size={64} label="Match" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <MatchConfidence confidence={match?.confidence} />
        {visibleBadges.map((badge) => <Badge key={badge}>{badge}</Badge>)}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4">
        <button type="button" className="btn-primary rounded-2xl px-5 py-2.5" disabled={requested} onClick={() => onSendRequest?.(profile)}>
          {requested ? "Request Sent" : "Send Request"}
        </button>
        <Link to={`/player/${profile?._id}`} className="text-sm font-bold text-clutch-text transition hover:text-clutch-blue">
          View Profile
        </Link>
        <button type="button" className="text-sm font-bold text-clutch-muted transition hover:text-clutch-text" onClick={() => setOpen((current) => !current)}>
          Why?
        </button>
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

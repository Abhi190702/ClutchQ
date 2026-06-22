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

  return (
    <article className="group border-b border-white/10 py-4 transition hover:bg-white/[0.025]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white/[0.055] font-semibold text-clutch-blue">
            {initials(profile?.displayName)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-clutch-text">{profile?.displayName}</h3>
            <p className="mt-1 truncate text-sm text-clutch-muted">{game?.gameName} - {game?.roles?.slice(0, 2).join(", ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <RankBadge rank={game?.rank} />
              <TrustBadge score={profile?.trustScore} />
              {profile?.region ? <Badge>{profile.region}</Badge> : null}
            </div>
          </div>
        </div>
        <ScoreRing score={match?.totalScore} size={68} label="Match" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile?.badges?.slice(0, 2).map((badge) => <Badge key={badge}>{badge}</Badge>)}
        {profile?.micAvailable ? <Badge>Mic Ready</Badge> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-primary py-2" disabled={requested} onClick={() => onSendRequest?.(profile)}>
          {requested ? "Request Sent" : "Send Request"}
        </button>
        <Link to={`/player/${profile?._id}`} className="btn-secondary py-2">
          View Profile
        </Link>
        <button type="button" className="btn-secondary py-2" onClick={() => setOpen((current) => !current)}>
          Details
        </button>
      </div>

      <DetailDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={`Why ${profile?.displayName || "this player"} fits`}
        subtitle={`${game?.gameName || "Primary game"} · ${match?.totalScore || 0}% match`}
      >
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="border-l border-white/10 pl-3">
            <div className="text-2xl font-black text-white">{profile?.reliabilityScore || 0}%</div>
            <div className="text-xs font-semibold text-zinc-500">Reliability</div>
          </div>
          <div className="border-l border-white/10 pl-3">
            <div className="text-2xl font-black text-white">{match?.availability?.overlapHours || 0}h</div>
            <div className="text-xs font-semibold text-zinc-500">Overlap</div>
          </div>
        </div>
        <div className="mb-5">
          <MatchConfidence confidence={match?.confidence} />
        </div>
        <div className="border-t border-white/10 pt-4">
          <MatchBreakdown match={match} />
        </div>
      </DetailDrawer>
    </article>
  );
};

export default PlayerCard;

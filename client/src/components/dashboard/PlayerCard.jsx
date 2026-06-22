import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../common/Badge";
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
    <article className="group border-b border-white/10 py-5 transition hover:bg-white/[0.025]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white/[0.055] font-semibold text-clutch-blue">
            {initials(profile?.displayName)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-clutch-text">{profile?.displayName}</h3>
            <p className="mt-1 text-sm text-clutch-muted">{game?.gameName} - {game?.roles?.join(", ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <RankBadge rank={game?.rank} />
              <TrustBadge score={profile?.trustScore} />
              <Badge>{profile?.region}</Badge>
              <Badge>{profile?.micAvailable ? "Mic Ready" : "No Mic"}</Badge>
            </div>
          </div>
        </div>
        <ScoreRing score={match?.totalScore} size={82} label="Match" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="text-clutch-muted">Reliability <span className="font-black text-clutch-text">{profile?.reliabilityScore || 0}%</span></span>
        <span className="text-clutch-muted">Overlap <span className="font-black text-clutch-text">{match?.availability?.overlapHours || 0}h</span></span>
        <MatchConfidence confidence={match?.confidence} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile?.badges?.slice(0, 4).map((badge) => <Badge key={badge}>{badge}</Badge>)}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn-primary py-2" disabled={requested} onClick={() => onSendRequest?.(profile)}>
          {requested ? "Request Sent" : "Send Request"}
        </button>
        <Link to={`/player/${profile?._id}`} className="btn-secondary py-2">
          View Profile
        </Link>
        <button type="button" className="btn-secondary py-2" onClick={() => setOpen((current) => !current)}>
          Why this match?
        </button>
      </div>

      {open && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <MatchBreakdown match={match} />
        </div>
      )}
    </article>
  );
};

export default PlayerCard;

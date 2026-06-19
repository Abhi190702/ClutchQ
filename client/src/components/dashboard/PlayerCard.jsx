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
    <article className="card p-5 transition hover:border-clutch-blue/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-clutch-border bg-clutch-panelSoft font-semibold text-clutch-blue">
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

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-clutch-border bg-clutch-panelSoft p-3">
          <div className="text-xs text-clutch-muted">Reliability</div>
          <div className="text-lg font-semibold text-clutch-text">{profile?.reliabilityScore || 0}%</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-panelSoft p-3">
          <div className="text-xs text-clutch-muted">Overlap</div>
          <div className="text-lg font-semibold text-clutch-text">{match?.availability?.overlapHours || 0}h</div>
        </div>
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
        <div className="mt-5 border-t border-clutch-border pt-5">
          <MatchBreakdown match={match} />
        </div>
      )}
    </article>
  );
};

export default PlayerCard;

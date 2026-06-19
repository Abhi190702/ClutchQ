import Badge from "../common/Badge";
import RankBadge from "../common/RankBadge";
import TrustBadge from "../common/TrustBadge";
import { getPrimaryGame } from "../../utils/rankLogic";
import { initials } from "../../utils/formatters";

const ProfileHeader = ({ profile, actions }) => {
  const game = getPrimaryGame(profile);
  const user = profile?.userId;

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-clutch-border bg-clutch-panelSoft text-2xl font-black text-clutch-cyan">
            {initials(profile?.displayName || user?.name)}
          </div>
          <div>
            <h2 className="text-2xl font-black text-clutch-text">{profile?.displayName || user?.name || "Unnamed Player"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-clutch-muted">{profile?.bio || "No bio yet."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <RankBadge rank={game?.rank} />
              <TrustBadge score={profile?.trustScore} />
              <Badge>{profile?.micAvailable ? "Mic Ready" : "Mic Optional"}</Badge>
              <Badge>{profile?.region || "No Region"}</Badge>
            </div>
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
};

export default ProfileHeader;

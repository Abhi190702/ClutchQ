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
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-clutch-border bg-clutch-panelSoft text-xl font-semibold text-clutch-blue">
            {initials(profile?.displayName || user?.name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-clutch-text">{profile?.displayName || user?.name || "Unnamed Player"}</h2>
            <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-clutch-muted">{profile?.bio || "No bio yet."}</p>
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

import Badge from "../common/Badge";
import { badgeDescription } from "../../utils/badges";

const PlayerBadges = ({ badges = [] }) => (
  <div className="card p-5">
    <h3 className="mb-4 text-lg font-semibold text-clutch-text">Player badges</h3>
    <div className="flex flex-wrap gap-2">
      {badges.length ? badges.map((badge) => <Badge key={badge} title={badgeDescription(badge)}>{badge}</Badge>) : <span className="text-sm text-clutch-muted">No badges yet.</span>}
    </div>
  </div>
);

export default PlayerBadges;

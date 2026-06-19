import { rankTone } from "../../utils/rankLogic";

const RankBadge = ({ rank }) => (
  <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${rankTone(rank)}`}>{rank || "Unranked"}</span>
);

export default RankBadge;

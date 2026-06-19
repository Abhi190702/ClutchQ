import RankBadge from "../common/RankBadge";

const GameRankCard = ({ game }) => (
  <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-black text-clutch-text">{game?.gameName || "Game"}</h3>
        <p className="mt-1 text-sm text-clutch-muted">{game?.roles?.join(", ") || "Flex roles"}</p>
      </div>
      <RankBadge rank={game?.rank} />
    </div>
    <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-clutch-muted">{game?.playstyle || "Balanced"} playstyle</div>
  </div>
);

export default GameRankCard;

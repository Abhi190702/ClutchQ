import ScoreRing from "../common/ScoreRing";
import { fitLabel } from "../../utils/lobbyState";

const LobbyCompatibility = ({ compatibility }) => {
  const rawScore = compatibility?.score;
  const hasScore = rawScore !== null && rawScore !== undefined && Number.isFinite(Number(rawScore));
  const score = hasScore ? Math.round(Number(rawScore)) : null;

  return (
    <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
      <div className="flex items-center gap-3">
        {hasScore ? (
          <ScoreRing score={score} size={70} label="Lobby" />
        ) : (
          <div className="grid h-[70px] w-[70px] shrink-0 place-items-center rounded-full border border-clutch-border bg-clutch-panel text-sm font-black text-clutch-muted">
            --
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-clutch-text">Lobby compatibility</div>
          <p className="mt-1 text-xs leading-5 text-clutch-muted">
            {hasScore ? fitLabel(score) : compatibility?.warnings?.[0] || "No compatibility data yet."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LobbyCompatibility;

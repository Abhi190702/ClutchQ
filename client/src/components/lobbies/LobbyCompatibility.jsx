import ScoreRing from "../common/ScoreRing";

const LobbyCompatibility = ({ compatibility }) => (
  <div className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
    <div className="flex items-center gap-3">
      <ScoreRing score={compatibility?.score || 0} size={70} label="Lobby" />
      <div>
        <div className="text-sm font-semibold text-clutch-text">Lobby compatibility</div>
        <p className="mt-1 text-xs leading-5 text-clutch-muted">
          {compatibility?.warnings?.length ? compatibility.warnings[0] : "Rank, region, language, and squad fit look stable."}
        </p>
      </div>
    </div>
  </div>
);

export default LobbyCompatibility;

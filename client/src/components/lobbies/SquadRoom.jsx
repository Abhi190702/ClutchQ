import SquadChemistryGraph from "./SquadChemistryGraph";
import SquadRoleBalance from "./SquadRoleBalance";
import ReadyCheck from "./ReadyCheck";
import Badge from "../common/Badge";
import { formatServerDateTime } from "../../utils/formatters";

const SquadRoom = ({ data, onLobbyUpdate }) => {
  const { lobby, memberProfiles, chemistry } = data;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{lobby.title}</h2>
              <p className="mt-2 text-sm text-clutch-muted">
                {lobby.game} - {lobby.region} - starts {formatServerDateTime(lobby.displayStartTime || lobby.startTime || lobby.startsAt || lobby.createdAt || lobby.updatedAt, "when full")}
              </p>
            </div>
            <Badge>{lobby.inviteCode}</Badge>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {lobby.currentMembers?.map((member) => (
              <div key={member.userId?._id || member.userId || member._id} className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
                <div className="font-bold text-clutch-text">{member.userId?.name || "Member"}</div>
                <div className="mt-1 text-sm text-clutch-muted">{member.role} - {member.ready ? "Ready" : "Waiting"}</div>
              </div>
            ))}
          </div>
        </div>
        <SquadChemistryGraph members={memberProfiles} pairwiseScores={chemistry.pairwiseScores} />
      </div>
      <div className="space-y-6">
        <ReadyCheck lobby={lobby} onUpdate={onLobbyUpdate} />
        <SquadRoleBalance roleBalance={chemistry.roleBalance} />
        <div className="card p-5">
          <h3 className="text-lg font-semibold">Compatibility warnings</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {chemistry.warnings?.length ? chemistry.warnings.map((warning) => <Badge key={warning} tone="border-clutch-amber/40 bg-clutch-amber/10 text-amber-100">{warning}</Badge>) : <Badge tone="border-clutch-green/40 bg-clutch-green/10 text-green-200">No major warnings</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadRoom;

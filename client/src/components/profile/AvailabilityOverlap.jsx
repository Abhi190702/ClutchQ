import AvailabilityHeatmap from "./AvailabilityHeatmap";
import { overlapCells } from "../../utils/availability";

const AvailabilityOverlap = ({ yours = [], theirs = [] }) => {
  const overlap = overlapCells(yours, theirs);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-clutch-text">Availability overlap</h3>
          <p className="mt-1 text-sm text-clutch-muted">{overlap.length} shared queue hour{overlap.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-lg border border-clutch-green/40 bg-clutch-green/10 px-3 py-2 text-sm font-bold text-green-200">Overlap</div>
      </div>
      <AvailabilityHeatmap value={[...yours, ...theirs]} overlap={overlap} readonly compact />
    </div>
  );
};

export default AvailabilityOverlap;

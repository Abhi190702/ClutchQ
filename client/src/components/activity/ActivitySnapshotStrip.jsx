import { formatHours, formatNumber } from "../../utils/formatters";
import MetricStrip from "../common/MetricStrip";

const ActivitySnapshotStrip = ({ snapshot }) => {
  const metrics = [
    { label: "Total playtime", value: formatHours(snapshot.totalMinutes) },
    { label: "This week", value: formatHours(snapshot.weekMinutes) },
    { label: "This month", value: formatHours(snapshot.monthMinutes) },
    { label: "Sessions", value: formatNumber(snapshot.sessionsCount) },
    { label: "Best rated", value: snapshot.bestRatedGame },
    { label: "Current streak", value: snapshot.streak ? `${snapshot.streak} days` : "No streak" }
  ];

  return <MetricStrip metrics={metrics} />;
};

export default ActivitySnapshotStrip;

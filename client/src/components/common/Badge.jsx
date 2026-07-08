import { badgeTone } from "../../utils/badges";

const toneClasses = {
  default: "border-clutch-border bg-clutch-panelSoft text-clutch-muted",
  success: "border-clutch-green/40 bg-clutch-green/10 text-green-200",
  warning: "border-clutch-amber/40 bg-clutch-amber/10 text-amber-100",
  danger: "border-clutch-red/40 bg-clutch-red/10 text-red-100",
  info: "border-clutch-cyan/40 bg-clutch-cyan/10 text-cyan-100"
};

const Badge = ({ children, tone, title }) => {
  if (children === null || children === undefined || children === "") return null;

  const resolvedTone = toneClasses[tone] || tone || badgeTone(String(children)) || toneClasses.default;

  return (
    <span title={title} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${resolvedTone}`}>
      {children}
    </span>
  );
};

export default Badge;

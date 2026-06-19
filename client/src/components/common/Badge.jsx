import { badgeTone } from "../../utils/badges";

const Badge = ({ children, tone, title }) => (
  <span title={title} className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${tone || badgeTone(String(children))}`}>
    {children}
  </span>
);

export default Badge;

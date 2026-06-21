import { getInitials } from "../../utils/formatters";

const LobbyHostBadge = ({ host }) => {
  const name = host?.name || "Unknown host";
  const avatar = host?.avatar;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-xs font-black text-white">
        {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-black text-white">{name}</div>
        <div className="text-xs text-zinc-500">Host</div>
      </div>
    </div>
  );
};

export default LobbyHostBadge;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChevronIcon from "../common/ChevronIcon";
import PlatformIcon from "../platformIcons/PlatformIcon";
import { getInitials } from "../../utils/formatters";
import { PROFILE_TABS } from "../../utils/constants";

const menuGroups = [
  [
    { label: "My Profile", path: "/profile", helper: "Identity and snapshot" },
    { label: "Steam Library", path: `/profile?tab=${PROFILE_TABS.steam}`, helper: "Games and achievements" },
    { label: "Activity", path: `/profile?tab=${PROFILE_TABS.activity}`, helper: "Rhythm and sessions" },
    { label: "Connected Accounts", path: `/profile?tab=${PROFILE_TABS.connections}`, helper: "Platforms and OAuth" },
    { label: "Settings", path: `/profile?tab=${PROFILE_TABS.settings}`, helper: "Profile controls" }
  ],
  [
    { label: "Help / Support", path: "/requests", helper: "Requests inbox" },
    { label: "Privacy", path: `/profile?tab=${PROFILE_TABS.settings}`, helper: "Visibility and sync" }
  ]
];

const ProfileAccountMenu = ({ user, profile, steamSummary, steamLinked, onLogout, placement = "top", compact = false }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const displayName = profile?.displayName || user?.name || steamSummary?.displayName || "Player";
  const avatar = profile?.customAvatar?.dataUrl || steamSummary?.avatar || user?.avatar;
  const playerCode = profile?.playerCode || profile?.clutchTag || `CLQ-${String(user?._id || "PLAYER").slice(-5).toUpperCase()}`;
  const isSidebar = placement === "sidebar";

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    if (!window.confirm("Sign out of ClutchQ?")) return;
    setOpen(false);
    await onLogout();
  };

  return (
    <div className={`relative ${isSidebar && !compact ? "w-full" : ""}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${isSidebar && !compact ? "w-full justify-start rounded-[18px] px-3 py-3" : "rounded-[16px] px-2 py-2"} ${
          open
            ? "border-clutch-blue/40 bg-[#161a22] ring-1 ring-clutch-blue/20"
            : "border-white/[0.08] bg-white/[0.035] hover:border-white/15 hover:bg-white/[0.075]"
        } flex items-center gap-2 border text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] outline-none transition focus-visible:ring-2 focus-visible:ring-clutch-blue/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d12]`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-[12px] bg-[#242832] text-sm font-bold text-clutch-text ring-1 ring-white/10">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(displayName)}
        </span>
        {!compact && (
          <span className="min-w-0 flex-1">
            <span className="block max-w-36 truncate text-sm font-bold text-clutch-text">{displayName}</span>
            {isSidebar ? <span className="mt-0.5 block truncate text-xs font-semibold text-zinc-500">{playerCode}</span> : null}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`${isSidebar ? "bottom-[calc(100%+12px)] left-0" : "right-0 top-[calc(100%+12px)]"} scrollbar-none absolute z-50 max-h-[calc(100vh-120px)] w-[min(350px,calc(100vw-2rem))] overflow-y-auto rounded-[22px] border border-white/[0.12] bg-[#111319] shadow-[0_34px_100px_rgba(0,0,0,0.78),0_0_0_1px_rgba(255,255,255,0.025)]`}
          role="menu"
        >
          <div className="border-b border-white/[0.07] bg-[#171b23] px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-[15px] bg-[#242832] text-sm font-black text-clutch-text ring-1 ring-white/10">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-black text-clutch-text">{displayName}</div>
                <div className="mt-0.5 truncate text-xs font-semibold text-clutch-muted">{playerCode}</div>
              </div>
              {steamLinked && <PlatformIcon provider="steam" size={34} />}
            </div>
          </div>

          <div className="p-2.5">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={groupIndex ? "mt-2 border-t border-white/10 pt-2" : ""}>
                {group.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goTo(item.path)}
                    className="group flex w-full items-center justify-between gap-4 rounded-[15px] px-3.5 py-3 text-left transition hover:bg-white/[0.06]"
                    role="menuitem"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-clutch-text">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-clutch-muted">{item.helper}</span>
                    </span>
                    <ChevronIcon direction="right" size={14} className="text-clutch-muted transition group-hover:translate-x-0.5 group-hover:text-clutch-text" />
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.08] p-2.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-[15px] px-3.5 py-3 text-left text-sm font-semibold text-red-100 transition hover:bg-clutch-red/10"
              role="menuitem"
            >
              <span>Sign out</span>
              <span className="text-xs text-red-200">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAccountMenu;

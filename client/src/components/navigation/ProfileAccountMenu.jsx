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
        className={`${isSidebar && !compact ? "w-full justify-start rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3" : "rounded-full bg-clutch-panel px-2.5 py-2"} flex items-center gap-2 text-left transition hover:bg-clutch-panelSoft`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#3a3a42] text-sm font-bold text-clutch-text">
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
          className={`${isSidebar ? "bottom-14 left-0" : "right-0 top-14"} absolute z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-md border border-white/10 bg-[#242428] shadow-2xl`}
          role="menu"
        >
          <div className="bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[#3a3a42] text-sm font-black text-clutch-text">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-black text-clutch-text">{displayName}</div>
                <div className="mt-0.5 truncate text-xs font-semibold text-clutch-muted">{playerCode}</div>
              </div>
              {steamLinked && <PlatformIcon provider="steam" size={34} />}
            </div>
          </div>

          <div className="p-2">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={groupIndex ? "mt-2 border-t border-white/10 pt-2" : ""}>
                {group.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goTo(item.path)}
                    className="group flex w-full items-center justify-between gap-4 rounded-md px-3 py-3 text-left transition hover:bg-white/[0.055]"
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

          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-red-100 transition hover:bg-clutch-red/10"
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

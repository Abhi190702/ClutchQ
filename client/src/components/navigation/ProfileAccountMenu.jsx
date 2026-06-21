import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlatformIcon from "../platformIcons/PlatformIcon";
import { getInitials } from "../profile/profileDisplay";

const menuGroups = [
  [
    { label: "My Profile", path: "/profile", icon: "P" },
    { label: "Steam Library", path: "/profile?tab=steam", icon: "S" },
    { label: "Activity", path: "/profile?tab=activity", icon: "A" },
    { label: "Connected Accounts", path: "/profile?tab=connections", icon: "C" },
    { label: "Settings", path: "/profile?tab=settings", icon: "E" }
  ],
  [
    { label: "Help / Support", path: "/requests", icon: "?" },
    { label: "Privacy", path: "/profile?tab=settings", icon: "i" }
  ]
];

const MenuIcon = ({ label }) => (
  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/5 text-xs font-black text-clutch-muted">
    {label}
  </span>
);

const ProfileAccountMenu = ({ user, profile, steamSummary, steamLinked, onLogout }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const displayName = profile?.displayName || user?.name || steamSummary?.displayName || "Player";
  const avatar = profile?.customAvatar?.dataUrl || steamSummary?.avatar || user?.avatar;
  const playerCode = profile?.playerCode || profile?.clutchTag || `CLQ-${String(user?._id || "PLAYER").slice(-5).toUpperCase()}`;

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
    setOpen(false);
    await onLogout();
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full bg-clutch-panel px-2.5 py-2 text-left transition hover:bg-clutch-panelSoft"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#3a3a42] text-sm font-bold text-clutch-text">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(displayName)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-bold text-clutch-text sm:block">{displayName}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-md border border-white/10 bg-[#242428] shadow-2xl"
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
              <div key={groupIndex} className={groupIndex ? "border-t border-white/10 pt-2" : ""}>
                {group.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goTo(item.path)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-clutch-muted transition hover:bg-white/[0.06] hover:text-clutch-text"
                    role="menuitem"
                  >
                    <MenuIcon label={item.icon} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-red-100 transition hover:bg-clutch-red/10"
              role="menuitem"
            >
              <MenuIcon label="->" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAccountMenu;

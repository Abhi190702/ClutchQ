const iconStyles = {
  google: "bg-white text-[#111]",
  discord: "bg-[#5865F2] text-white",
  steam: "bg-[#17314f] text-white",
  epic: "bg-white text-black",
  microsoft: "bg-white text-black",
  xbox: "bg-[#107C10] text-white",
  playstation: "bg-[#064DAA] text-white",
  psn: "bg-[#064DAA] text-white",
  nintendo: "bg-[#E60012] text-white",
  default: "bg-clutch-panelSoft text-clutch-text"
};

const imageIcons = {
  google: "/brand/google.png",
  discord: "/brand/discord.png",
  steam: "/brand/steam.png",
  clutchq: "/brand/clutchq-logo.png"
};

const MicrosoftGlyph = () => (
  <span className="grid h-5 w-5 grid-cols-2 gap-0.5">
    <span className="bg-[#f25022]" />
    <span className="bg-[#7fba00]" />
    <span className="bg-[#00a4ef]" />
    <span className="bg-[#ffb900]" />
  </span>
);

const SteamGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <circle cx="8" cy="16" r="3.6" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="16.5" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M10.8 13.8l3.4-3.4M4 14.5l4.2 1.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
  </svg>
);

const DiscordGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M7.2 8.2c2.9-1.3 6.7-1.3 9.6 0l1 6.8c-1.9 1.4-3.8 2.1-5.8 2.1S8.1 16.4 6.2 15l1-6.8z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    <circle cx="9.8" cy="12" r="1" fill="currentColor" />
    <circle cx="14.2" cy="12" r="1" fill="currentColor" />
  </svg>
);

const glyphMap = {
  google: <span className="text-lg font-black text-[#4285F4]">G</span>,
  discord: <DiscordGlyph />,
  steam: <SteamGlyph />,
  epic: <span className="text-[10px] font-black leading-none">EPIC</span>,
  microsoft: <MicrosoftGlyph />,
  xbox: <span className="text-lg font-black">X</span>,
  playstation: <span className="text-sm font-black">PS</span>,
  psn: <span className="text-sm font-black">PS</span>,
  nintendo: <span className="text-lg font-black">N</span>
};

const PlatformIcon = ({ provider = "default", size = 42, className = "" }) => {
  const key = String(provider).toLowerCase();
  const glyph = glyphMap[key] || <span className="text-sm font-black">{key.slice(0, 1).toUpperCase() || "C"}</span>;
  const image = imageIcons[key];

  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full ${image ? "bg-white" : iconStyles[key] || iconStyles.default} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      ) : null}
      <span className={image ? "hidden" : ""}>{glyph}</span>
    </span>
  );
};

export default PlatformIcon;

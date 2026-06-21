const logoBgClasses = {
  blue: "bg-[#064fb6]",
  green: "bg-[#107c10]",
  red: "bg-[#e60012]",
  violet: "bg-[#5865f2]",
  sky: "bg-[#1b75bb]",
  white: "bg-white",
  dark: "bg-[#111113]",
  neutral: "bg-[#f4f4f5]"
};

const AuthProviderCard = ({ provider, onClick, disabled = false }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onClick?.(provider)}
    aria-label={`${provider.label}: ${provider.description}`}
    className="group min-h-36 rounded-[20px] border border-[#34343a] bg-[#242428] p-5 text-center transition hover:-translate-y-0.5 hover:bg-[#2a2a2f] focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-40"
  >
    <span className={`mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full ${logoBgClasses[provider.logoBg] || logoBgClasses.neutral}`}>
      {provider.logoUrl ? (
        <img
          src={provider.logoUrl}
          alt=""
          className={provider.logoUrl.startsWith("/brand/") ? "h-full w-full object-cover" : "h-10 w-10 object-contain"}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-2xl font-semibold text-[#111113]">{provider.shortLabel}</span>
      )}
    </span>
    <span className="mx-auto mt-4 block max-w-40 text-base font-semibold leading-6 text-[#f4f4f5]">{provider.label}</span>
  </button>
);

export default AuthProviderCard;

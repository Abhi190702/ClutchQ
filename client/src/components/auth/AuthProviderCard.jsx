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

const AuthProviderCard = ({ provider, onClick, disabled = false }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick?.(provider)}
      aria-label={`${provider.label}: ${provider.description}`}
      className="group min-h-40 rounded-[26px] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1.5 hover:border-white/[0.18] hover:shadow-[0_28px_80px_rgba(0,0,0,0.34)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 md:min-h-44"
    >
      <span className={`mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-[20px] shadow-[0_14px_34px_rgba(0,0,0,0.28)] ${logoBgClasses[provider.logoBg] || logoBgClasses.neutral}`}>
        {provider.logoUrl && !imageFailed ? (
          <img
            src={provider.logoUrl}
            alt=""
            className={provider.logoUrl.startsWith("/brand/") ? "h-full w-full object-cover" : "h-10 w-10 object-contain"}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className={`text-xl font-black ${provider.logoBg === "dark" || provider.logoBg === "blue" || provider.logoBg === "green" || provider.logoBg === "red" || provider.logoBg === "violet" || provider.logoBg === "sky" ? "text-white" : "text-[#111113]"}`}>
            {provider.shortLabel}
          </span>
        )}
      </span>
      <span className="mx-auto mt-5 block max-w-40 text-base font-black leading-6 text-[#f4f4f5]">{provider.label}</span>
    </button>
  );
};

export default AuthProviderCard;
import { useState } from "react";

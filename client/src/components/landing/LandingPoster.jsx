import { useEffect, useState } from "react";
import { gameInitials, getGameArt } from "../../utils/gameArt";

const LandingPoster = ({
  game,
  src,
  alt,
  className = "",
  imageClassName = "",
  style,
  children
}) => {
  const imageSrc = src || game?.image || getGameArt(game?.title || game?.game);
  const label = alt || game?.title || game?.game || "Game poster";
  const accent = game?.accent || "#35b8ff";
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageSrc]);

  return (
    <div className={`relative overflow-hidden bg-[#19191f] ${className}`} style={style}>
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label}
          loading="lazy"
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center px-5 text-center"
          style={{
            background: `radial-gradient(circle at 30% 18%, ${accent}66, transparent 34%), linear-gradient(145deg, #2a2a31, #101014 62%)`
          }}
        >
          <div className="rounded-2xl border border-white/[0.15] bg-black/30 px-5 py-4 text-4xl font-black text-white">
            {gameInitials(label)}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default LandingPoster;

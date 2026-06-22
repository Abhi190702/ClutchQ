const Stat = ({ label, value, caption }) => (
  <div className="rounded-md border border-clutch-border bg-clutch-panel px-4 py-3">
    <div className="text-2xl font-bold text-clutch-text">{value}</div>
    <div className="mt-1 text-sm font-semibold text-clutch-muted">{label}</div>
    {caption && <div className="mt-2 text-xs text-clutch-muted">{caption}</div>}
  </div>
);

const ProfileStatCards = ({ profile, playerScore, libraryCount = 0 }) => {
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="ClutchQ Score" value={playerScore?.overall ?? "--"} caption="Gaming profile score" />
      <Stat label="Trust Score" value={profile?.trustScore != null ? `${profile.trustScore}%` : "No data"} caption={`${profile?.totalReviews || 0} teammate reviews`} />
      <Stat label="Primary Game" value={primaryGame?.gameName || "Set one"} caption={primaryGame?.rank || "Add rank in onboarding"} />
      <Stat label="Steam Library" value={libraryCount || 0} caption="Synced games tracked" />
    </div>
  );
};

export default ProfileStatCards;

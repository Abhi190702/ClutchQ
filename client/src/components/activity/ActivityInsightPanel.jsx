import { formatHours } from "../../utils/formatters";

const ActivityInsightPanel = ({ snapshot, split = [], insights = [], rhythmSummary }) => {
  const leadGame = split[0];
  const secondGame = split[1];
  const focus = rhythmSummary?.dominantGame && rhythmSummary.dominantGame !== "No dominant game"
    ? `${rhythmSummary.dominantGame} owns ${rhythmSummary.dominantGameShare || 0}% of your current rhythm.`
    : leadGame ? `${leadGame.gameName} owns your current rhythm.` : "No dominant game yet.";
  const nextStep = snapshot.weekMinutes
    ? "Keep the same window and invite compatible teammates before queue."
    : "Start one tracked session or sync Steam to build reliable recommendations.";

  return (
    <section className="border-b border-white/10 pb-6">
      <div className="eyebrow mb-3">Insight</div>
      <h2 className="text-2xl font-black text-white">What this activity says</h2>
      <div className="mt-6 space-y-5">
        <div>
          <div className="text-sm font-bold text-zinc-500">Current pattern</div>
          <p className="mt-1 text-lg font-black leading-7 text-white">{focus}</p>
          {secondGame ? <p className="mt-1 text-sm text-zinc-400">{secondGame.gameName} is the backup rhythm at {formatHours(secondGame.minutes)}.</p> : null}
        </div>
        {insights.length ? (
          <div className="border-t border-white/10 pt-5">
            <div className="text-sm font-bold text-zinc-500">Gameplay graph notes</div>
            <div className="mt-3 space-y-2">
              {insights.slice(0, 3).map((insight) => (
                <p key={insight} className="text-sm leading-6 text-zinc-300">{insight}</p>
              ))}
            </div>
          </div>
        ) : null}
        <div className="border-t border-white/10 pt-5">
          <div className="text-sm font-bold text-zinc-500">Recommended move</div>
          <p className="mt-1 text-sm leading-6 text-zinc-300">{nextStep}</p>
        </div>
      </div>
    </section>
  );
};

export default ActivityInsightPanel;

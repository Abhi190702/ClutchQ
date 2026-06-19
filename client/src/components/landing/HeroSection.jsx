import { Link } from "react-router-dom";
import ScoreRing from "../common/ScoreRing";
import Badge from "../common/Badge";

const HeroSection = () => (
  <section className="relative overflow-hidden border-b border-clutch-border">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[1.05fr_0.95fr] md:px-6">
      <div className="animate-floatUp">
        <div className="eyebrow mb-4">Find your perfect gaming squad before the match begins.</div>
        <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-clutch-text md:text-7xl">
          Find Your Perfect Gaming Squad.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-clutch-muted">
          ClutchQ matches gamers by rank, role, region, language, availability, playstyle, and trust score so every queue starts with the right team.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/login" className="btn-primary">
            Find Teammates
          </Link>
          <Link to="/lobbies/create" className="btn-secondary">
            Create Lobby
          </Link>
        </div>
      </div>

      <div className="scanline card p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-sm font-bold text-clutch-cyan">Live Match Explanation</div>
            <h2 className="mt-2 text-2xl font-black">Abhijeet + RogueRohan</h2>
          </div>
          <ScoreRing score={92} label="Squad" />
        </div>
        <div className="mt-6 grid gap-3">
          {[
            ["Game Match", "+25", "Both main Valorant"],
            ["Rank Match", "+18", "Gold 2 and Gold 3"],
            ["Availability", "+12", "9 PM to 12 AM overlap"],
            ["Role Balance", "+8", "Duelist plus Controller"]
          ].map(([label, points, reason]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
              <div>
                <div className="text-sm font-bold text-clutch-text">{label}</div>
                <div className="text-xs text-clutch-muted">{reason}</div>
              </div>
              <Badge tone="border-clutch-green/40 bg-clutch-green/10 text-green-200">{points}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;

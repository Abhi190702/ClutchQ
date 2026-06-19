import { Link } from "react-router-dom";
import ScoreRing from "../common/ScoreRing";
import Badge from "../common/Badge";

const HeroSection = () => (
  <section className="relative overflow-hidden border-b border-clutch-border">
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_0.92fr] md:px-6 lg:py-24">
      <div>
        <div className="eyebrow mb-4">ClutchQ</div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-clutch-text md:text-6xl">
          Find reliable teammates before you queue.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-clutch-muted">
          Match with players by game, rank, role, region, availability, mic preference, and trust history. Keep the useful details visible without making the app noisy.
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

      <div className="card p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-sm font-semibold text-clutch-blue">Match preview</div>
            <h2 className="mt-2 text-2xl font-semibold">Abhijeet + RogueRohan</h2>
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
                <div className="text-sm font-semibold text-clutch-text">{label}</div>
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

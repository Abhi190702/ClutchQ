import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import PageShell from "../components/common/PageShell";
import GameDiscoveryRail from "../components/landing/GameDiscoveryRail";
import GameFirstHero from "../components/landing/GameFirstHero";
import GameplayGraphPreview from "../components/landing/GameplayGraphPreview";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import LandingCTA from "../components/landing/LandingCTA";
import LiveSquadPreview from "../components/landing/LiveSquadPreview";

// Signed-in players get Discover inside the same Squad Console shell as every
// other page, so navigation stays uniform and the Discover tab never vanishes.
const DiscoverConsole = () => (
  <PageShell flush>
    <GameDiscoveryRail />
    <LiveSquadPreview />
    <HowItWorksSection />
  </PageShell>
);

// Signed-out visitors get the full marketing landing with the top navbar.
const MarketingLanding = () => (
  <div className="noise-bg min-h-screen overflow-x-hidden text-clutch-text">
    <Navbar />
    <main>
      <GameFirstHero />
      <GameDiscoveryRail />
      <LiveSquadPreview />
      <HowItWorksSection />
      <GameplayGraphPreview />
      <LandingCTA />
    </main>
    <footer className="border-t border-white/[0.07] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-[1540px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src="/brand/clutchq-logo.png" alt="" className="h-11 w-11 rounded-[14px] object-cover ring-1 ring-white/10" />
          <div>
            <div className="font-black text-white">ClutchQ</div>
            <div className="mt-0.5 text-sm text-zinc-500">Built for better squads, not random queues.</div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-zinc-500">
          <Link to="/games" className="transition hover:text-white">Games</Link>
          <Link to="/login" className="transition hover:text-white">Sign in</Link>
          <Link to="/register" className="transition hover:text-white">Create account</Link>
        </nav>
      </div>
    </footer>
  </div>
);

const Landing = () => {
  const { user, loading } = useAuth();
  // A stored session is still being verified — avoid flashing the marketing
  // page to someone who is actually signed in.
  if (loading && !user) {
    return <div className="noise-bg grid min-h-screen place-items-center text-sm font-semibold text-zinc-400">Loading ClutchQ...</div>;
  }
  return user ? <DiscoverConsole /> : <MarketingLanding />;
};

export default Landing;

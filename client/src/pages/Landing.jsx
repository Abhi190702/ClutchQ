import Navbar from "../components/common/Navbar";
import CafeValidationSection from "../components/landing/CafeValidationSection";
import FeaturedGameShowcase from "../components/landing/FeaturedGameShowcase";
import GameDiscoveryRail from "../components/landing/GameDiscoveryRail";
import GameFirstHero from "../components/landing/GameFirstHero";
import GameplayGraphPreview from "../components/landing/GameplayGraphPreview";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import LandingCTA from "../components/landing/LandingCTA";
import LiveSquadPreview from "../components/landing/LiveSquadPreview";

const Landing = () => (
  <div className="noise-bg min-h-screen overflow-x-hidden text-clutch-text">
    <Navbar />
    <main>
      <GameFirstHero />
      <FeaturedGameShowcase />
      <LiveSquadPreview />
      <GameDiscoveryRail />
      <CafeValidationSection />
      <HowItWorksSection />
      <GameplayGraphPreview />
      <LandingCTA />
    </main>
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm font-semibold text-zinc-500 sm:px-6">
      ClutchQ - Built for gamers who hate random queues.
    </footer>
  </div>
);

export default Landing;

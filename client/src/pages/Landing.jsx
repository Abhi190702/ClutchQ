import Navbar from "../components/common/Navbar";
import DemoPreview from "../components/landing/DemoPreview";
import FeatureSection from "../components/landing/FeatureSection";
import HeroSection from "../components/landing/HeroSection";
import LandingCTA from "../components/landing/LandingCTA";
import ProblemSection from "../components/landing/ProblemSection";

const Landing = () => (
  <div className="noise-bg min-h-screen text-clutch-text">
    <Navbar />
    <HeroSection />
    <ProblemSection />
    <FeatureSection />
    <DemoPreview />
    <LandingCTA />
  </div>
);

export default Landing;

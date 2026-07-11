import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { featuredGames } from "../../data/landingShowcase";
import LandingPoster from "./LandingPoster";

const LandingCTA = () => {
  const { demoLogin, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const continueDemo = async () => {
    if (user) {
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      await demoLogin();
      showToast("Demo squad loaded");
      navigate("/dashboard");
    } catch (error) {
      showToast(error?.message || "Demo login failed. Try the login page.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1540px] px-4 py-16 sm:px-6 lg:py-24">
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(125deg,rgba(61,187,250,0.13),rgba(20,22,28,0.96)_38%,rgba(142,144,255,0.08))] p-7 shadow-[0_36px_120px_rgba(0,0,0,0.4)] sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-30 lg:block">
          <div className="absolute right-8 top-8 flex rotate-6 gap-4">
            {featuredGames.slice(0, 4).map((game, index) => (
              <LandingPoster
                key={game.title}
                game={game}
                className="h-64 w-40 rounded-[24px]"
                imageClassName="opacity-90"
                style={{ marginTop: index % 2 ? 32 : 0 }}
              />
            ))}
          </div>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="eyebrow mb-3">Try the seeded demo</div>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-6xl">Ready to build your next squad?</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            Try the seeded demo or create your own gamer profile. You will see games, lobbies, Steam-ready identity, Discord voice rooms, activity, and the Gameplay Graph flow.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={continueDemo} disabled={loading} className="btn-primary rounded-xl px-6 py-3">
              {loading ? "Loading demo..." : "Continue Demo"}
            </button>
            <Link to="/register" className="btn-secondary rounded-xl px-6 py-3">
              Create Account
            </Link>
            <Link to="/games" className="btn-secondary rounded-xl px-6 py-3">
              Browse Games
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;

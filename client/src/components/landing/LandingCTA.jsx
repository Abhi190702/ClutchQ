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
    <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:py-20">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#1d1d22] p-6 sm:p-8 lg:p-10">
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
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Ready to build your next squad?</h2>
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

import { Link } from "react-router-dom";

const LandingCTA = () => (
  <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
    <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
      <div>
        <div className="eyebrow mb-3">Queue smarter tonight</div>
        <h2 className="section-title">ClutchQ is a squad intelligence system.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-clutch-muted">
          Not just a gaming matchmaking website. It visually explains why players should team up.
        </p>
      </div>
      <Link to="/login" className="btn-primary whitespace-nowrap">
        Continue Demo
      </Link>
    </div>
  </section>
);

export default LandingCTA;

import { Link } from "react-router-dom";

const LandingCTA = () => (
  <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
    <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
      <div>
        <div className="eyebrow mb-3">Try the seeded demo</div>
        <h2 className="section-title">Open the dashboard and test the full flow.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-clutch-muted">
          The demo account already has profile data, recommendations, lobbies, reviews, reports, and admin data.
        </p>
      </div>
      <Link to="/login" className="btn-primary whitespace-nowrap">
        Continue Demo
      </Link>
    </div>
  </section>
);

export default LandingCTA;

import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";

const NotFound = () => (
  <PageShell title="Page not found" eyebrow="404">
    <div className="card p-8">
      <p className="text-clutch-muted">This route does not exist in ClutchQ.</p>
      <Link to="/dashboard" className="btn-primary mt-5">Back to dashboard</Link>
    </div>
  </PageShell>
);

export default NotFound;

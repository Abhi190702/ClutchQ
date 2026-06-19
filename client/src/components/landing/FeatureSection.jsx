const features = [
  "Smart Matchmaking",
  "Live Match Explanation",
  "Availability Heatmap",
  "Squad Chemistry Graph",
  "Trust Score",
  "Role Balance Detection",
  "Admin Safety Layer"
];

const FeatureSection = () => (
  <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
    <div className="mb-8 flex flex-col gap-2">
      <div className="eyebrow">SSS+++ Differentiators</div>
      <h2 className="section-title">The algorithm thinks out loud.</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <div key={feature} className="card p-5 transition hover:-translate-y-1 hover:border-clutch-cyan/50">
          <div className="mb-5 h-1 w-10 rounded-full bg-clutch-cyan" style={{ opacity: 0.45 + index * 0.06 }} />
          <h3 className="text-lg font-black text-clutch-text">{feature}</h3>
          <p className="mt-3 text-sm leading-6 text-clutch-muted">
            Transparent, demo-ready intelligence that shows fit, gaps, warnings, and next-best squad action.
          </p>
        </div>
      ))}
    </div>
  </section>
);

export default FeatureSection;

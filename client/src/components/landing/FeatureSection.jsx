const features = [
  "Rank and Role Matching",
  "Match Explanation",
  "Availability Heatmap",
  "Squad Chemistry Graph",
  "Trust Score",
  "Role Balance Detection",
  "Admin Safety Layer"
];

const FeatureSection = () => (
  <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
    <div className="mb-8 flex flex-col gap-2">
      <div className="eyebrow">Core features</div>
      <h2 className="section-title">Everything needed to form a better squad.</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <div key={feature} className="card p-5 transition hover:border-clutch-blue/50">
          <div className="mb-5 h-1 w-10 rounded-full bg-clutch-blue" style={{ opacity: 0.45 + index * 0.06 }} />
          <h3 className="text-lg font-semibold text-clutch-text">{feature}</h3>
          <p className="mt-3 text-sm leading-6 text-clutch-muted">
            Clear profile signals, fit reasons, warnings, and actions without burying the player in settings.
          </p>
        </div>
      ))}
    </div>
  </section>
);

export default FeatureSection;

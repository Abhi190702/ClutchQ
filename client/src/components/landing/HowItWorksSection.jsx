const steps = [
  {
    title: "Pick your game",
    text: "Choose Valorant, BGMI, CS2, Apex, Minecraft, Fortnite, or any squad-based game.",
    icon: "M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 9h6M9 10h2m2 0h2"
  },
  {
    title: "Match with players",
    text: "ClutchQ checks rank, role, region, language, mic, availability, trust, and activity rhythm.",
    icon: "M8 12h8m-4-4v8M5 5l14 14M19 5 5 19"
  },
  {
    title: "Queue with context",
    text: "Join lobbies, create Discord voice rooms, track sessions, upload scorecards, and build your Gameplay Graph.",
    icon: "M6 15c2-5 10-5 12 0M8 18h8M12 5v4m0 0 3-3m-3 3L9 6"
  }
];

const StepIcon = ({ path }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
    <path d={path} />
  </svg>
);

const HowItWorksSection = () => (
  <section className="mx-auto max-w-[1540px] px-4 py-14 sm:px-6 lg:py-20">
    <div className="mb-8 max-w-3xl">
      <div className="eyebrow mb-3">How it works</div>
      <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">From game pick to voice-ready squad in three moves.</h2>
    </div>
    <div className="grid border-y border-white/[0.08] lg:grid-cols-3 lg:divide-x lg:divide-white/[0.08]">
      {steps.map((step, index) => (
        <div key={step.title} className="px-2 py-8 sm:px-6 lg:px-8 lg:py-10 first:lg:pl-0 last:lg:pr-0">
          <div className="mb-8 flex items-center justify-between">
            <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-clutch-blue text-[#071017] shadow-cyan">
              <StepIcon path={step.icon} />
            </div>
            <div className="text-5xl font-black tracking-[-0.05em] text-white/[0.08]">0{index + 1}</div>
          </div>
          <h3 className="text-2xl font-black text-white">{step.title}</h3>
          <p className="mt-4 text-base leading-7 text-zinc-300">{step.text}</p>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorksSection;

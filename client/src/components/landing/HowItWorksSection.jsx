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
  <section className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:py-16">
    <div className="mb-8 max-w-3xl">
      <div className="eyebrow mb-3">How it works</div>
      <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">From game pick to voice-ready squad in three moves.</h2>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-[28px] border border-white/10 bg-[#1d1d22] p-6 transition hover:bg-[#232329]">
          <div className="mb-8 flex items-center justify-between">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-black">
              <StepIcon path={step.icon} />
            </div>
            <div className="text-5xl font-black text-white/10">0{index + 1}</div>
          </div>
          <h3 className="text-2xl font-black text-white">{step.title}</h3>
          <p className="mt-4 text-base leading-7 text-zinc-300">{step.text}</p>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorksSection;

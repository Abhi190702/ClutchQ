import { useState } from "react";
import { cafeFindings, cafeImages } from "../../data/landingShowcase";

const CafeImage = ({ src, index }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid min-h-36 place-items-center rounded-3xl border border-white/10 bg-black/[0.24] p-5 text-center">
        <div>
          <div className="text-3xl font-black text-white">OTG</div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Field survey {index + 1}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`OTG Gaming Cafe field survey ${index + 1}`}
      loading="lazy"
      className="min-h-36 rounded-3xl object-cover"
      onError={() => setFailed(true)}
    />
  );
};

const CafeValidationSection = () => (
  <section className="mx-auto grid max-w-[1480px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
    <div className="rounded-[28px] border border-white/10 bg-[#1d1d22] p-6 sm:p-8">
      <div className="eyebrow mb-3">Field validation</div>
      <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Tested with real gamers at OTG Gaming Cafe.</h2>
      <p className="mt-5 text-base leading-7 text-zinc-300">
        A small survey with young gamers and the cafe owner revealed a practical problem: players often switch between PCs, Steam IDs, Discord IDs, and friend groups. Good teammates are discovered during sessions but rarely saved into one unified system.
      </p>
      <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-lg font-black leading-8 text-white">
        Built from real gaming cafe problems, not just assumptions.
      </div>
    </div>

    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {cafeImages.map((image, index) => (
          <CafeImage key={image} src={image} index={index} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cafeFindings.map((finding, index) => (
          <div key={finding} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-clutch-blue">0{index + 1}</div>
            <div className="mt-3 text-lg font-black text-white">{finding}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CafeValidationSection;

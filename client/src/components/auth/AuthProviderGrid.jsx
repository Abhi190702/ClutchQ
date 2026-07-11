import AuthProviderCard from "./AuthProviderCard";

const AuthProviderGrid = ({ title, subtitle, providers, onProviderClick }) => (
  <section className="border-t border-white/[0.07] py-9">
    <div className="mx-auto mb-7 max-w-xl text-center">
      <h2 className="text-2xl font-black tracking-[-0.03em] text-[#f4f4f5]">{title}</h2>
      {subtitle && <p className="mt-2 text-base leading-6 text-[#b8b8bd]">{subtitle}</p>}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {providers.map((provider) => (
        <AuthProviderCard key={provider.id} provider={provider} onClick={onProviderClick} />
      ))}
    </div>
  </section>
);

export default AuthProviderGrid;

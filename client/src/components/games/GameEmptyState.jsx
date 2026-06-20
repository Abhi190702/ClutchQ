const GameEmptyState = ({ title = "Nothing here yet", description = "Try another filter or create the first room." }) => (
  <div className="rounded-[10px] border border-dashed border-[#3a3a42] bg-[#18181c] p-8 text-center">
    <div className="text-lg font-bold text-white">{title}</div>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">{description}</p>
  </div>
);

export default GameEmptyState;

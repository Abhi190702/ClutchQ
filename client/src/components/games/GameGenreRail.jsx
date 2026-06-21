const genreArtwork = {
  FPS: [
    "/game-art/valorant.png",
    "/game-art/escape-from-tarkov-arena.png",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900_2x.jpg"
  ],
  "Battle Royale": [
    "/game-art/fortnite.png",
    "/game-art/bgmi.png",
    "/game-art/free-fire.png"
  ],
  "Co-op": [
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1966720/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/739630/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_600x900_2x.jpg"
  ],
  "Social Deduction": [
    "https://cdn.cloudflare.steamstatic.com/steam/apps/945360/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1568590/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/774861/library_600x900_2x.jpg"
  ],
  Sports: [
    "/game-art/rocket-league.png",
    "/game-art/ea-fc.png",
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=320&q=80"
  ],
  Racing: [
    "/game-art/trackmania.png",
    "/game-art/rocket-league.png",
    "/game-art/f1.png",
  ],
  Sandbox: [
    "/game-art/minecraft.png",
    "/game-art/roblox.png",
    "/game-art/fall-guys.png"
  ]
};

const fallbackImages = [
  "/game-art/league-of-legends.png",
  "/game-art/mobile-legends.png",
  "/game-art/roblox.png"
];

const GenreArtwork = ({ genre }) => {
  const images = genreArtwork[genre] || fallbackImages;

  return (
    <div className="relative mb-5 h-32 overflow-hidden rounded-md bg-[#18181c]">
      <div className="absolute inset-0 flex items-center justify-center gap-0">
        {images.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            loading="lazy"
            className={`h-28 w-24 rounded object-cover shadow-none ${index === 1 ? "z-10 scale-110" : "opacity-75"}`}
            style={{ marginLeft: index === 0 ? 0 : -16 }}
          />
        ))}
      </div>
    </div>
  );
};

const GameGenreRail = ({ genres = [], activeGenre, onSelect }) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black tracking-tight text-white">Popular Genres</h2>
      {activeGenre ? (
        <button type="button" className="text-sm font-bold text-sky-300" onClick={() => onSelect("")}>
          Clear
        </button>
      ) : null}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {genres.slice(0, 10).map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => onSelect(activeGenre === genre ? "" : genre)}
          className={`rounded-[10px] border p-5 text-left transition ${
            activeGenre === genre ? "border-zinc-500 bg-[#2a2a31]" : "border-[#2f2f36] bg-[#1c1c21] hover:bg-[#24242a]"
          }`}
        >
          <GenreArtwork genre={genre} />
          <div className="text-lg font-bold text-white">{genre}</div>
        </button>
      ))}
    </div>
  </section>
);

export default GameGenreRail;

const genreArtwork = {
  FPS: [
    "https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/359550/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/library_600x900_2x.jpg"
  ],
  "Battle Royale": [
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1962663/library_600x900_2x.jpg",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/578080/library_600x900_2x.jpg"
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
    "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=320&q=80",
    "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=320&q=80",
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=320&q=80"
  ],
  Racing: [
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900_2x.jpg",
    "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=320&q=80",
    "https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&w=320&q=80"
  ]
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=320&q=80"
];

const GenreArtwork = ({ genre }) => {
  const images = genreArtwork[genre] || fallbackImages;

  return (
    <div className="relative mb-6 h-28 overflow-hidden rounded-md bg-[#18181c]">
      <div className="absolute inset-0 flex items-center justify-center gap-0">
        {images.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            loading="lazy"
            className={`h-24 w-20 rounded object-cover shadow-none ${index === 1 ? "z-10 scale-110" : "opacity-75"}`}
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {genres.slice(0, 8).map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => onSelect(activeGenre === genre ? "" : genre)}
          className={`rounded-[10px] border p-5 text-left transition ${
            activeGenre === genre ? "border-zinc-500 bg-[#2a2a31]" : "border-[#2f2f36] bg-[#202024] hover:bg-[#28282d]"
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

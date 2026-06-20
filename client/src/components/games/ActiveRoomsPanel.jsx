import GameRoomCard from "./GameRoomCard";
import GameEmptyState from "./GameEmptyState";

const ActiveRoomsPanel = ({ rooms = [], user, onUpdated, limit }) => {
  const visibleRooms = limit ? rooms.slice(0, limit) : rooms;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-white">Active Rooms</h2>
        <span className="text-sm text-zinc-400">{rooms.length} open</span>
      </div>
      {visibleRooms.length ? (
        <div className="grid gap-3">
          {visibleRooms.map((room) => (
            <GameRoomCard key={room._id} room={room} user={user} onUpdated={onUpdated} />
          ))}
        </div>
      ) : (
        <GameEmptyState title="No active rooms yet" description="Create the first room and let compatible players join you." />
      )}
    </section>
  );
};

export default ActiveRoomsPanel;

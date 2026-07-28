import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const memberIdOf = (member) => String(member.userId?._id || member.userId || member._id || member.id || "");

const ReadyCheck = ({ lobby, onUpdate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const currentUserId = String(user?._id || user?.id || "");

  const members = lobby.currentMembers || [];
  const myReady = members.some((member) => memberIdOf(member) === currentUserId && member.ready);
  const total = members.length;
  const readyCount = members.filter((member) => member.ready).length;
  const allReady = total > 0 && readyCount === total;

  const updateReady = async (ready) => {
    if (saving || ready === myReady) return; // already in this state — nothing to do
    setSaving(true);
    const previous = lobby;
    // Optimistic update, keeping populated member data intact.
    onUpdate?.({
      ...lobby,
      currentMembers: members.map((member) => (memberIdOf(member) === currentUserId ? { ...member, ready } : member))
    });
    try {
      const response = await api.patch(`/lobbies/${lobby._id}/ready`, { ready });
      const serverLobby = response.data.data || {};
      // The ready endpoint returns an unpopulated lobby, so merge the server's
      // ready flags onto our already-populated members (keeps names/avatars).
      const readyById = new Map((serverLobby.currentMembers || []).map((m) => [String(m.userId?._id || m.userId || ""), m.ready]));
      onUpdate?.({
        ...serverLobby,
        currentMembers: members.map((member) => {
          const id = memberIdOf(member);
          return readyById.has(id) ? { ...member, ready: readyById.get(id) } : member;
        })
      });
      showToast(ready ? "You're marked ready" : "Marked not ready", "info");
    } catch (error) {
      onUpdate?.(previous);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ready check</h3>
        <span className="text-sm font-semibold text-clutch-blue">
          {readyCount}/{total} Ready
        </span>
      </div>

      <div className={`mb-4 flex flex-wrap items-center gap-2 text-sm font-bold ${myReady ? "text-clutch-green" : "text-zinc-400"}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${myReady ? "bg-clutch-green shadow-[0_0_8px_rgba(55,216,164,0.9)]" : "bg-zinc-500"}`} />
        {myReady ? "You're ready" : "You're not ready yet"}
        {allReady ? <span className="text-clutch-green">· squad is fully ready</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
        <button
          type="button"
          disabled={saving}
          aria-pressed={myReady}
          onClick={() => updateReady(true)}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition ${
            myReady
              ? "bg-clutch-green/15 text-clutch-green ring-1 ring-clutch-green/40"
              : "bg-clutch-blue text-[#061018] hover:bg-[#68cbfb]"
          }`}
        >
          {myReady ? "✓ Ready" : "I'm Ready"}
        </button>
        <button
          type="button"
          disabled={saving}
          aria-pressed={!myReady}
          onClick={() => updateReady(false)}
          className={`flex items-center justify-center rounded-xl py-2.5 text-sm font-black transition ${
            !myReady ? "bg-white/[0.06] text-zinc-200 ring-1 ring-white/15" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          Not Ready
        </button>
      </div>
    </div>
  );
};

export default ReadyCheck;

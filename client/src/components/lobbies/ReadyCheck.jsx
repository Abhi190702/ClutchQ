import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const ReadyCheck = ({ lobby, onUpdate }) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const updateReady = async (ready) => {
    setSaving(true);
    const previous = lobby;
    onUpdate?.({ ...lobby, currentMembers: lobby.currentMembers.map((member) => ({ ...member, ready: member.ready })) });
    try {
      const response = await api.patch(`/lobbies/${lobby._id}/ready`, { ready });
      onUpdate?.(response.data.data);
      showToast(ready ? "Ready check updated" : "Marked not ready", "info");
    } catch (error) {
      onUpdate?.(previous);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const readyCount = lobby.currentMembers?.filter((member) => member.ready).length || 0;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black">Ready check</h3>
        <span className="text-sm font-bold text-clutch-cyan">{readyCount}/{lobby.currentMembers?.length || 0} Ready</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button disabled={saving} onClick={() => updateReady(true)} className="btn-primary py-2" type="button">Ready</button>
        <button disabled={saving} onClick={() => updateReady(false)} className="btn-secondary py-2" type="button">Not Ready</button>
      </div>
    </div>
  );
};

export default ReadyCheck;

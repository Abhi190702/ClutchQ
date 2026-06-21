import { Link } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import RequestRow from "./RequestRow";

const RequestsInbox = ({ requests = [], direction, onAction, emptyTitle, emptyDescription }) => {
  if (!requests.length) {
    return (
      <EmptyState
        compact
        className="border-white/10 bg-white/[0.035]"
        title={emptyTitle}
        description={emptyDescription}
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/lobbies" className="btn-secondary">Browse Lobbies</Link>
            <Link to="/dashboard" className="btn-primary">Find Squad Now</Link>
          </div>
        }
      />
    );
  }

  return (
    <section className="rounded-3xl bg-white/[0.035] px-5">
      {requests.map((request) => (
        <RequestRow key={request._id} request={request} direction={request.direction || direction} onAction={onAction} />
      ))}
    </section>
  );
};

export default RequestsInbox;

import EmptyState from "../common/EmptyState";
import RequestCard from "./RequestCard";

const OutgoingRequests = ({ requests = [], onAction }) =>
  requests.length ? (
    <div className="space-y-3">{requests.map((request) => <RequestCard key={request._id} request={request} direction="outgoing" onAction={onAction} />)}</div>
  ) : (
    <EmptyState title="No outgoing requests." description="Send your first teammate request from the dashboard or request to join a lobby." />
  );

export default OutgoingRequests;

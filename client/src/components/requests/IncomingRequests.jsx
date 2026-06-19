import EmptyState from "../common/EmptyState";
import RequestCard from "./RequestCard";

const IncomingRequests = ({ requests = [], onAction }) =>
  requests.length ? (
    <div className="space-y-3">{requests.map((request) => <RequestCard key={request._id} request={request} direction="incoming" onAction={onAction} />)}</div>
  ) : (
    <EmptyState title="No incoming requests." description="When players or lobby applicants reach out, they will appear here." />
  );

export default IncomingRequests;

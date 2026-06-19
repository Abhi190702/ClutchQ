import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SkeletonCard from "./SkeletonCard";

const AdminRoute = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="noise-bg min-h-screen p-6">
        <SkeletonCard rows={6} />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default AdminRoute;

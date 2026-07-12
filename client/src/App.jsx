import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/common/AdminRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import usePageTitle from "./hooks/usePageTitle";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const CreateLobby = lazy(() => import("./pages/CreateLobby"));
const Activity = lazy(() => import("./pages/Activity"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const GameRooms = lazy(() => import("./pages/GameRooms"));
const Games = lazy(() => import("./pages/Games"));
const Landing = lazy(() => import("./pages/Landing"));
const Leaderboards = lazy(() => import("./pages/Leaderboards"));
const Lobbies = lazy(() => import("./pages/Lobbies"));
const LobbyDetails = lazy(() => import("./pages/LobbyDetails"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const Requests = lazy(() => import("./pages/Requests"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Squad = lazy(() => import("./pages/Squad"));

const RouteFallback = () => (
  <div className="noise-bg grid min-h-screen place-items-center text-sm font-semibold text-zinc-400">Loading ClutchQ...</div>
);

const App = () => {
  usePageTitle();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth/success" element={<OAuthSuccess />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/games" element={<Games />} />
      <Route path="/games/:slug" element={<GameDetail />} />
      <Route path="/games/:slug/rooms" element={<GameRooms />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/leaderboards" element={<Leaderboards />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/player/:id" element={<PlayerProfile />} />
      <Route path="/lobbies" element={<Lobbies />} />
      <Route path="/lobbies/create" element={<CreateLobby />} />
      <Route path="/lobbies/:id" element={<LobbyDetails />} />
      <Route path="/squad/:id" element={<Squad />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<AdminRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>
    </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;

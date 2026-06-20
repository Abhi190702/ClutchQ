import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/common/AdminRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import CreateLobby from "./pages/CreateLobby";
import Activity from "./pages/Activity";
import Dashboard from "./pages/Dashboard";
import GameDetail from "./pages/GameDetail";
import GameRooms from "./pages/GameRooms";
import Games from "./pages/Games";
import Landing from "./pages/Landing";
import Leaderboards from "./pages/Leaderboards";
import Lobbies from "./pages/Lobbies";
import LobbyDetails from "./pages/LobbyDetails";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import OAuthSuccess from "./pages/OAuthSuccess";
import PlayerProfile from "./pages/PlayerProfile";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Requests from "./pages/Requests";
import Reviews from "./pages/Reviews";
import Squad from "./pages/Squad";

const App = () => (
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
);

export default App;

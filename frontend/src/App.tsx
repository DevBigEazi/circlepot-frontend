import AuthModal from "./modals/AuthModal";
import ProfileCreationModal from "./modals/ProfileCreationModal";
import { Route, Routes, Navigate } from "react-router";
import Dashboard from "./pages/Dashboard";
import { useActiveAccount } from "thirdweb/react";
import { useUserProfile } from "./hooks/useUserProfile";
import LoadingSpinner from "./components/LoadingSpinner";
import AutoConnectWallet from "./components/AutoConnectWallet";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import TransactionsHistory from "./pages/TransactionsHistory";
import Goals from "./pages/Goals";
import CreateCircle from "./pages/CreateCircle";
import Analytics from "./pages/Analytics";
import CreatePersonalGoal from "./pages/CreatePersonalGoal";
import Create from "./pages/Create";
import Browse from "./pages/Browse";
import Erorr404 from "./pages/404";
import Layout from "./layouts/Layout";

interface AppProps {
  client: any; // thirdweb client
}

function App({ client }: AppProps) {
  const account = useActiveAccount();
  const { hasProfile, isLoading, profile, refreshProfile } =
    useUserProfile(client);

  // Show auth modal if not authenticated
  const showAuthModal = !account;

  // Show profile creation modal if authenticated but no profile
  // Only show after initial loading completes and hasProfile is explicitly false
  const showProfileModal = account && hasProfile === false && !isLoading;

  // Show dashboard if authenticated and has profile
  const showDashboard = account && hasProfile === true;

  // Handle successful profile creation
  const handleProfileCreated = () => {
    // Refresh profile data to update the UI
    refreshProfile();
  };

  // Check if current URL is invalid dashboard ID
  const isInvalidDashboardId = () => {
    const path = window.location.pathname;
    const dashboardMatch = path.match(/^\/dashboard\/(.+)$/);
    if (dashboardMatch && profile?.accountId) {
      const urlId = dashboardMatch[1];
      return urlId !== String(profile.accountId);
    }
    return false;
  };

  return (
    <main className="min-h-screen">
      {/* Enable auto-reconnection of wallet on page load */}
      <AutoConnectWallet />

      {/* Loading state while checking profile or initializing */}
      {account && (isLoading || hasProfile === null) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface rounded-2xl p-8 shadow-2xl">
            <LoadingSpinner size="lg" text="Loading your profile..." />
          </div>
        </div>
      )}

      {/* Private Routes - only show when authenticated, has profile, and profile is loaded */}
      {showDashboard && !isLoading && !isInvalidDashboardId() && (
        <Routes>
          <Route element={<Layout />}>
            {/* Redirect root to dashboard with user ID */}
            <Route
              index
              element={<Navigate to={`/dashboard/${profile?.accountId}`} replace />}
            />
            <Route path="/dashboard/:userId" element={<Dashboard />} />
            <Route path="/create" element={<Create />} />
            <Route path="/create/personal-goal" element={<CreatePersonalGoal />} />
            <Route path="/create/circle" element={<CreateCircle />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/goals" element={<Goals />} />
            <Route
              path="/transactions-history"
              element={<TransactionsHistory />}
            />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Not Found - outside Layout so no bottom nav */}
          <Route path="*" element={<Erorr404 />} />
        </Routes>
      )}

      {/* Show 404 without Layout for invalid dashboard IDs */}
      {showDashboard && isInvalidDashboardId() && <Erorr404 />}

      {/* Landing page + Auth Modal for unauthenticated users */}
      {showAuthModal && (
        <>
          {/* Landing page background */}
          <Dashboard />
          {/* Auth modal overlay */}
          <AuthModal />
        </>
      )}

      {/* Profile Creation Modal - shows after auth but before profile creation */}
      {showProfileModal && (
        <ProfileCreationModal
          client={client}
          onProfileCreated={handleProfileCreated}
        />
      )}
    </main>
  );
}

export default App;
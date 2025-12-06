import { lazy, Suspense } from "react";
import AuthModal from "./modals/AuthModal";
import ProfileCreationModal from "./modals/ProfileCreationModal";
import { Route, Routes, Navigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useUserProfile } from "./hooks/useUserProfile";
import LoadingSpinner from "./components/LoadingSpinner";
import AutoConnectWallet from "./components/AutoConnectWallet";
import { BiometricProvider } from "./contexts/BiometricContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { Toaster } from "sonner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import SkeletonPage from "./components/SkeletonPage";

// Lazy load page components for code-splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const TransactionsHistory = lazy(() => import("./pages/TransactionsHistory"));
const Goals = lazy(() => import("./pages/Goals"));
const CreateCircle = lazy(() => import("./pages/CreateCircle"));
const Circles = lazy(() => import("./pages/Circles"));
const CreatePersonalGoal = lazy(() => import("./pages/CreatePersonalGoal"));
const Create = lazy(() => import("./pages/Create"));
const Browse = lazy(() => import("./pages/Browse"));
const JoinCircle = lazy(() => import("./pages/JoinCircle"));
const Erorr404 = lazy(() => import("./pages/404"));
const Layout = lazy(() => import("./layouts/Layout"));

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
      <Toaster position="top-center" />
      <NotificationsProvider>
        <CurrencyProvider>
          <BiometricProvider
            userId={profile?.accountId ? String(profile.accountId) : ""}
          >
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
              <Suspense fallback={<SkeletonPage />}>
                <Routes>
                  <Route element={<Layout />}>
                    {/* Redirect root to dashboard with user ID */}
                    <Route
                      index
                      element={
                        <Navigate
                          to={`/dashboard/${profile?.accountId}`}
                          replace
                        />
                      }
                    />
                    <Route path="/dashboard/:userId" element={<Dashboard />} />
                    <Route path="/create" element={<Create />} />
                    <Route
                      path="/create/personal-goal"
                      element={<CreatePersonalGoal />}
                    />
                    <Route path="/create/circle" element={<CreateCircle />} />
                    <Route
                      path="/circles/join/:circleId"
                      element={<JoinCircle />}
                    />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/circles" element={<Circles />} />
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
              </Suspense>
            )}

            {/* Show 404 without Layout for invalid dashboard IDs */}
            {showDashboard && isInvalidDashboardId() && (
              <Suspense fallback={<SkeletonPage />}>
                <Erorr404 />
              </Suspense>
            )}

            {/* Landing page + Auth Modal for unauthenticated users */}
            {showAuthModal && (
              <>
                {/* Landing page background */}
                <Suspense fallback={<SkeletonPage />}>
                  <Dashboard />
                </Suspense>
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

            {/* PWA Install Prompt - Global, non-intrusive */}
            <PWAInstallPrompt />
          </BiometricProvider>
        </CurrencyProvider>
      </NotificationsProvider>
    </main>
  );
}

export default App;

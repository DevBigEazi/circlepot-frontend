import { lazy, Suspense, useState } from "react";
import AuthModal from "./modals/AuthModal";
// import LinkContactModal from "./modals/LinkContactModal";
import ProfileCreationModal from "./modals/ProfileCreationModal";
import PushNotificationReminderModal from "./modals/PushNotificationReminderModal";
import { Route, Routes, Navigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useUserProfile } from "./hooks/useUserProfile";
import AutoConnectWallet from "./components/AutoConnectWallet";
import { BiometricProvider } from "./contexts/BiometricContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { Toaster, toast } from "sonner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import SkeletonPage from "./components/SkeletonPage";
import DataErrorState from "./components/DataErrorState";
import { useEffect } from "react";
import {
  getReferralFromURL,
  saveReferralCode,
  cleanURL,
} from "./utils/referral";
import { CircleAndGoalsProvider } from "./contexts/CircleAndGoalsContext";
import { shouldShowPushReminder } from "./utils/pushNotificationManager";
import BiometricReminderModal from "./modals/BiometricReminderModal";
import { shouldShowBiometricReminder } from "./utils/biometricReminderManager";

// Lazy load page components for code-splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const TransactionsHistory = lazy(() => import("./pages/TransactionsHistory"));
const Goals = lazy(() => import("./pages/Goals"));
const CreateCircle = lazy(() => import("./pages/CreateCircle"));
const Circles = lazy(() => import("./pages/Circles"));
const CreatePersonalGoal = lazy(() => import("./pages/CreatePersonalGoal"));
const Create = lazy(() => import("./pages/Create"));
const Browse = lazy(() => import("./pages/Browse"));
const JoinCircle = lazy(() => import("./pages/JoinCircle"));
const LocalMethods = lazy(() => import("./pages/LocalMethods"));
const ExternalWallets = lazy(() => import("./pages/ExternalWallets"));
const WithdrawInternal = lazy(() => import("./pages/WithdrawInternal"));
const WithdrawLocal = lazy(() => import("./pages/WithdrawLocal"));
const WithdrawExternal = lazy(() => import("./pages/WithdrawExternal"));
const Error404 = lazy(() => import("./pages/404"));
const Layout = lazy(() => import("./layouts/Layout"));
import GlobalNotificationSync from "./components/GlobalNotificationSync";

interface AppProps {
  client: any; // thirdweb client
}

function App({ client }: AppProps) {
  const account = useActiveAccount();
  const {
    hasProfile,
    isLoading,
    profile,
    refreshProfile,
    error: profileError,
  } = useUserProfile(client);

  // const [showLinkContact, setShowLinkContact] = useState(false);
  const [showPushReminder, setShowPushReminder] = useState(false);
  const [showBiometricReminder, setShowBiometricReminder] = useState(false);

  // Show auth modal if not authenticated
  const showAuthModal = !account;

  // Show profile creation modal if authenticated but no profile
  // Only show after initial loading completes and hasProfile is explicitly false
  const showProfileModal = account && hasProfile === false && !isLoading;

  // Show dashboard if authenticated and has profile
  const showDashboard = account && hasProfile === true;

  // Check if user needs to link contact info (missing email or phone)
  // const needsContactLink = profile && (!profile.email || !profile.phoneNumber);

  // Handle successful profile creation
  const handleProfileCreated = () => {
    // Refresh profile data to update the UI
    refreshProfile();
  };

  // Show link contact modal when user logs in and is missing contact info
  // useEffect(() => {
  //   if (showDashboard && !isLoading && needsContactLink) {
  //     setShowLinkContact(true);
  //   }
  // }, [showDashboard, isLoading, needsContactLink]);

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

  // Capture referral code from URL
  useEffect(() => {
    const code = getReferralFromURL();
    if (code) {
      if (hasProfile === false || hasProfile === null) {
        saveReferralCode(code);
        toast.success("Welcome to Circlepot!", {
          description: `You've been referred by ${code}. Create your profile to join the community.`,
        });
      }
      cleanURL();
    }
  }, [hasProfile]);

  // Check if we should show push notification reminder
  useEffect(() => {
    // Only check when user is authenticated, has profile, and app is loaded
    if (showDashboard && !isLoading) {
      // Add a small delay to let the user settle in before showing the prompt
      const timer = setTimeout(async () => {
        const shouldShow = await shouldShowPushReminder();
        setShowPushReminder(shouldShow);
      }, 2000); // 2 second delay after dashboard loads

      return () => clearTimeout(timer);
    }
  }, [showDashboard, isLoading]);

  // Check if we should show biometric reminder (after push notification)
  useEffect(() => {
    // Only check when user is authenticated, has profile, and app is loaded
    // AND push reminder is not showing (biometric comes after push)
    if (showDashboard && !isLoading && !showPushReminder) {
      // Add delay: 2s base + 5s extra if push was just dismissed
      const delay = 7000; // 7 seconds to allow push modal flow to complete
      const timer = setTimeout(async () => {
        const shouldShow = await shouldShowBiometricReminder(
          profile?.accountId ? String(profile.accountId) : null,
        );
        setShowBiometricReminder(shouldShow);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [showDashboard, isLoading, showPushReminder, profile?.accountId]);

  return (
    <main className="min-h-screen">
      <Toaster position="top-center" />
      <NotificationsProvider>
        {/* Wrap with CircleAndGoalsProvider to centralize data fetching and prevent duplicate RPC calls */}
        <CircleAndGoalsProvider client={client}>
          <GlobalNotificationSync />
          <CurrencyProvider>
            <BiometricProvider
              userId={profile?.accountId ? String(profile.accountId) : ""}
            >
              {/* Enable auto-reconnection of wallet on page load */}
              <AutoConnectWallet />

              {/* Loading state while checking profile or initializing */}
              {account &&
                (isLoading || (hasProfile === null && !profileError)) && (
                  <SkeletonPage />
                )}

              {/* Error state if data fetching fails */}
              {account && profileError && hasProfile === null && (
                <DataErrorState
                  onRetry={refreshProfile}
                  message={
                    profileError.includes("database unavailable")
                      ? "Our database is currently taking a break. We're working to wake it up and get you back in!"
                      : undefined
                  }
                />
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
                      <Route
                        path="/dashboard/:userId"
                        element={<Dashboard />}
                      />
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
                      <Route
                        path="/notifications"
                        element={<Notifications />}
                      />
                      <Route
                        path="/notifications/settings"
                        element={<NotificationSettings />}
                      />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/local-methods" element={<LocalMethods />} />
                      <Route
                        path="/external-wallets"
                        element={<ExternalWallets />}
                      />
                      <Route
                        path="/withdraw/internal"
                        element={<WithdrawInternal />}
                      />
                      <Route
                        path="/withdraw/local"
                        element={<WithdrawLocal />}
                      />
                      <Route
                        path="/withdraw/external"
                        element={<WithdrawExternal />}
                      />
                    </Route>

                    {/* Not Found - outside Layout so no bottom nav */}
                    <Route path="*" element={<Error404 />} />
                  </Routes>
                </Suspense>
              )}

              {/* Show 404 without Layout for invalid dashboard IDs */}
              {showDashboard && isInvalidDashboardId() && (
                <Suspense fallback={<SkeletonPage />}>
                  <Error404 />
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

              {/* Link Contact Modal - shows when user is missing email or phone */}
              {/* {showLinkContact && needsContactLink && (
              <LinkContactModal
                onClose={() => setShowLinkContact(false)}
                onSkip={() => setShowLinkContact(false)}
              />
            )} */}

              {/* Push Notification Reminder Modal - shows to users who haven't subscribed */}
              {showPushReminder && (
                <PushNotificationReminderModal
                  onClose={() => setShowPushReminder(false)}
                />
              )}

              {/* Biometric Security Reminder Modal - shows after push notification reminder */}
              {showBiometricReminder && profile?.accountId && (
                <BiometricReminderModal
                  onClose={() => setShowBiometricReminder(false)}
                  userId={String(profile.accountId)}
                  userName={profile.username || ""}
                  userEmail={profile.email || ""}
                />
              )}

              {/* PWA Install Prompt - Global, non-intrusive */}
              <PWAInstallPrompt />
            </BiometricProvider>
          </CurrencyProvider>
        </CircleAndGoalsProvider>
      </NotificationsProvider>
    </main>
  );
}

export default App;

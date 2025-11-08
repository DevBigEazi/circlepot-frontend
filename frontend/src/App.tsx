import AuthModal from './modals/AuthModal';
import ProfileCreationModal from './modals/ProfileCreationModal';
import { Route, Routes } from 'react-router';
import Dashboard from './pages/Dashboard';
import { useActiveAccount } from 'thirdweb/react';
import { useUserProfile } from './hooks/useUserProfile';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuthContext } from './context/AuthContext';
import { getUserEmail } from 'thirdweb/wallets/in-app';
import { useEffect } from 'react';
import AutoConnectWallet from './components/AutoConnectWallet';


interface AppProps {
  client: any; // thirdweb client
}

function App({ client }: AppProps) {
  const account = useActiveAccount();
  const { hasProfile, isLoading, refreshProfile } = useUserProfile(client);
  const { userEmail, setUserEmail } = useAuthContext();

  // Auto-fetch email when wallet reconnects
  useEffect(() => {
    const fetchEmail = async () => {
      if (account && !userEmail) {
        try {
          const email = await getUserEmail({ client });
          if (email) {
            
            setUserEmail(email);
            // Refresh profile after email is retrieved to ensure sync
            refreshProfile();
          }
        } catch (error) {
          
        }
      }
    };

    fetchEmail();
  }, [account, client, userEmail, setUserEmail, refreshProfile]);

  // Show auth modal if not authenticated
  const showAuthModal = !account;

  // Show profile creation modal if authenticated but no profile
  // Only show after initial loading completes and hasProfile is explicitly false
  const showProfileModal = account && hasProfile === false && !isLoading && userEmail;

  // Show dashboard if authenticated and has profile
  const showDashboard = account && hasProfile === true;

  // Handle successful profile creation
  const handleProfileCreated = () => {
    // Refresh profile data to update the UI
    refreshProfile();
  };

  return (
    <main className="min-h-screen bg-background">
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

      {/* Private Routes - only show when authenticated and has profile */}
      {showDashboard && (
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      )}

      {/* Auth Modal - shows when not authenticated */}
      {showAuthModal && <AuthModal />}

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
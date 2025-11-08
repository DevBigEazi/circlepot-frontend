import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react'
import { useUserProfile } from '../hooks/useUserProfile'
import { useAuthContext } from '../context/AuthContext'
import { client } from '../thirdwebClient'
import { useThemeColors } from '../hooks/useThemeColors'
import { User, Mail, Wallet, LogOut } from 'lucide-react'
import ErrorDisplay from '../components/ErrorDisplay'
import LoadingSpinner from '../components/LoadingSpinner'
import { normalizeIpfsUrl } from '../utils/ipfs'

const Dashboard: React.FC = () => {
    const { disconnect } = useDisconnect()
    const account = useActiveAccount()
    const wallet = useActiveWallet()
    const navigate = useNavigate()
    const colors = useThemeColors()
    const { userEmail } = useAuthContext()
    const { profile, isLoading: isLoadingProfile } = useUserProfile(client)
    const [isDisconnecting, setIsDisconnecting] = React.useState(false)
    const [disconnectError, setDisconnectError] = React.useState<string | null>(null)

    // Normalize IPFS URL to ensure it's properly formatted
    const profileImageUrl = useMemo(() => {
        if (!profile?.profilePhoto) return null;
        const normalized = normalizeIpfsUrl(profile.profilePhoto);  
        return normalized;
    }, [profile?.profilePhoto])

    // Debug logging
    useEffect(() => {
        console.log('Dashboard - Account state:', account)
        console.log('Dashboard - Wallet state:', wallet)
        console.log('Dashboard - Profile state:', {
            hasProfile: !!profile,
            username: profile?.username,
            email: profile?.email,
            profilePhoto: profile?.profilePhoto,
            profilePhotoLength: profile?.profilePhoto?.length,
            isLoading: isLoadingProfile
        })
    }, [account, wallet, profile, isLoadingProfile])

    const handleDisconnect = async () => {
        try {
            setIsDisconnecting(true)
            setDisconnectError(null)

            if (wallet) {
                navigate("/")
                disconnect(wallet)
            }
        } catch (error: any) {
            console.error('Disconnect failed:', error)
            setDisconnectError('Failed to disconnect wallet. Please try again.')
        } finally {
            setIsDisconnecting(false)
        }
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold" style={{ color: colors.text }}>
                        Dashboard
                    </h2>
                    <button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        style={{ 
                            backgroundColor: colors.surface, 
                            color: colors.text,
                            border: `1px solid ${colors.border}`
                        }}
                    >
                        {isDisconnecting ? (
                            <LoadingSpinner size="sm" text="Disconnecting..." />
                        ) : (
                            <>
                                <LogOut size={18} />
                                Logout
                            </>
                        )}
                    </button>
                </div>

                {/* Disconnect Error */}
                {disconnectError && (
                    <div className="mb-6">
                        <ErrorDisplay
                            error={{ code: 'DISCONNECT_ERROR', message: disconnectError }}
                            onDismiss={() => setDisconnectError(null)}
                        />
                    </div>
                )}

                {/* Loading State */}
                {isLoadingProfile && (
                    <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size="lg" text="Loading your profile..." />
                    </div>
                )}

                {/* Profile Card */}
                {!isLoadingProfile && profile && (
                    <div className="max-w-4xl mx-auto">
                        <div 
                            className="rounded-2xl shadow-xl p-8 border"
                            style={{ 
                                backgroundColor: colors.surface, 
                                borderColor: colors.border 
                            }}
                        >
                            {/* Profile Header */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                                {/* Profile Photo */}
                                <div className="relative">
                                    <div 
                                        className="w-32 h-32 rounded-full overflow-hidden border-4 shadow-lg"
                                        style={{ borderColor: colors.primary }}
                                    >
                                        {profileImageUrl ? (
                                            <img 
                                                src={profileImageUrl} 
                                                alt={profile.username}
                                                className="w-full h-full object-cover"
                                                onLoad={() => {
                                                    console.log('Dashboard Profile image loaded successfully:', profileImageUrl);
                                                }}
                                                onError={(e) => {
                                                    console.error('Dashboard Failed to load profile image:', {
                                                        url: profileImageUrl,
                                                        error: e
                                                    });
                                                    // Fallback to user icon if image fails to load
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `
                                                            <div class="w-full h-full flex items-center justify-center" style="background-color: ${colors.background}">
                                                                <svg width="64" height="64" fill="${colors.textLight}" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-full flex items-center justify-center"
                                                style={{ backgroundColor: colors.background }}
                                            >
                                                <User size={64} style={{ color: colors.textLight }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h3 
                                        className="text-3xl font-bold mb-2"
                                        style={{ color: colors.text }}
                                    >
                                        {profile.username}
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <Mail size={18} style={{ color: colors.primary }} />
                                            <span 
                                                className="text-sm"
                                                style={{ color: colors.textLight }}
                                            >
                                                {profile.email || userEmail}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <Wallet size={18} style={{ color: colors.primary }} />
                                            <span 
                                                className="text-xs font-mono"
                                                style={{ color: colors.textLight }}
                                            >
                                                {account?.address ? 
                                                    `${account.address.slice(0, 6)}...${account.address.slice(-4)}` 
                                                    : 'Not connected'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Stats */}
                            <div 
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl"
                                style={{ backgroundColor: colors.background }}
                            >
                                <div className="text-center p-4">
                                    <div 
                                        className="text-2xl font-bold mb-1"
                                        style={{ color: colors.primary }}
                                    >
                                        {new Date(Number(profile.createdAt) * 1000).toLocaleDateString()}
                                    </div>
                                    <div 
                                        className="text-sm"
                                        style={{ color: colors.textLight }}
                                    >
                                        Member Since
                                    </div>
                                </div>
                                <div className="text-center p-4">
                                    <div 
                                        className="text-2xl font-bold mb-1"
                                        style={{ color: colors.primary }}
                                    >
                                        ✓
                                    </div>
                                    <div 
                                        className="text-sm"
                                        style={{ color: colors.textLight }}
                                    >
                                        Profile Verified
                                    </div>
                                </div>
                                <div className="text-center p-4">
                                    <div 
                                        className="text-2xl font-bold mb-1"
                                        style={{ color: colors.primary }}
                                    >
                                        On-Chain
                                    </div>
                                    <div 
                                        className="text-sm"
                                        style={{ color: colors.textLight }}
                                    >
                                        Stored on Blockchain
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
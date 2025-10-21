import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react'
import ErrorDisplay from '../components/ErrorDisplay'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard: React.FC = () => {
    const { disconnect } = useDisconnect()
    const account = useActiveAccount()
    const wallet = useActiveWallet()
    const navigate = useNavigate()
    const [isDisconnecting, setIsDisconnecting] = React.useState(false)
    const [disconnectError, setDisconnectError] = React.useState<string | null>(null)

    // Debug logging
    useEffect(() => {
        console.log('Dashboard - Account state:', account)
        console.log('Dashboard - Wallet state:', wallet)
    }, [account, wallet])

    const handleDisconnect = async () => {
        try {
            setIsDisconnecting(true)
            setDisconnectError(null)

            if (wallet) {
                disconnect(wallet)
                navigate("/")
            }
        } catch (error: any) {
            console.error('Disconnect failed:', error)
            setDisconnectError('Failed to disconnect wallet. Please try again.')
        } finally {
            setIsDisconnecting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-text mb-8">Dashboard</h2>

                {/* Disconnect Error */}
                {disconnectError && (
                    <div className="mb-6">
                        <ErrorDisplay
                            error={{ code: 'DISCONNECT_ERROR', message: disconnectError }}
                            onDismiss={() => setDisconnectError(null)}
                        />
                    </div>
                )}

                {account && (
                    <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
                        <h3 className="text-xl font-semibold text-text mb-4">Wallet Connected</h3>
                        <p className="text-text-light mb-4">
                            <span className="font-medium">Address:</span> {account.address}
                        </p>
                        <button
                            onClick={handleDisconnect}
                            disabled={isDisconnecting}
                            className="bg-accent text-surface px-4 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDisconnecting ? <LoadingSpinner size="sm" text="Disconnecting..." /> : 'Logout'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
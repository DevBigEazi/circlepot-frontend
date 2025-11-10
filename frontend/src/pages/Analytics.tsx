import React from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { client } from '../thirdwebClient'
import { useNavigate } from 'react-router'
import { useThemeColors } from '../hooks/useThemeColors'
import NavBar from '../components/NavBar'

const Analytics: React.FC = () => {
  const navigate = useNavigate()
  const colors = useThemeColors()

  const { profile } = useUserProfile(client)
  return (
    <>
      <NavBar colors={colors} userName={profile?.username} fullName={profile?.fullName} onBack={() => navigate(-1)} />

        {/* main UI */}
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <h1>Analytics</h1>
      </div>
    </>
  )
}

export default Analytics
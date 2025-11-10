import { Settings2 } from 'lucide-react'
import React from 'react'
import NavBar from '../components/NavBar'
import { useNavigate } from 'react-router'
import { useThemeColors } from '../hooks/useThemeColors'

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const colors = useThemeColors()
  
  return (
   <>
   <NavBar 
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Settings"
        titleIcon={<Settings2 size={24} />}
        colors={colors}
      />

        {/* main UI */}
      <div className='min-h-screen' style={{ backgroundColor: colors.background }}>
        <h1>Settings</h1>
      </div>
   </>
  )
}

export default Settings
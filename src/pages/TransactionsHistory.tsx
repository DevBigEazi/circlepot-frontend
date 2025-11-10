import React from 'react'
import { useNavigate } from 'react-router'
import { History, Filter } from 'lucide-react'
import { useThemeColors } from '../hooks/useThemeColors'
import NavBar from '../components/NavBar'

const TransactionsHistory: React.FC = () => {
  const navigate = useNavigate()
  const colors = useThemeColors()

  return (
    <>
      <NavBar 
        variant="minimal"
        onBack={() => navigate(-1)}
        title="Transaction History"
        titleIcon={<History size={24} />}
        colors={colors}
        actions={
          <button className="p-2 rounded-xl transition hover:opacity-80" style={{ color: colors.text }}>
            <Filter size={18} />
          </button>
        }
      />

      <div className='min-h-screen' style={{ backgroundColor: colors.background }}>
        <h1>TransactionsHistory</h1>
      </div>
    </>
  )
}

export default TransactionsHistory
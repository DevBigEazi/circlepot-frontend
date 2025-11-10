import React from 'react'
import { useThemeColors } from '../hooks/useThemeColors'
import { useNavigate } from 'react-router'

const Links: React.FC = () => {
  const colors = useThemeColors()
  const navigate = useNavigate()

  const links = [
    { label: 'Create', path: '/create' },
    { label: 'Browse', path: '/browse' },
    { label: 'Goals', path: '/goals' },
    { label: 'Settings', path: '/settings' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Transactions History', path: '/trasactions-history' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {links.map((link) => (
        <button
          key={link.path}
          onClick={() => navigate(link.path)}
          className="px-4 py-2 rounded-lg text-left font-medium transition-colors hover:opacity-80"
          style={{ 
            backgroundColor: colors.surface, 
            color: colors.text,
            borderColor: colors.border,
            border: `1px solid ${colors.border}`
          }}
        >
          {link.label}
        </button>
      ))}
    </div>
  )
}

export default Links
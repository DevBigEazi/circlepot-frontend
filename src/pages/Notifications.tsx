import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell } from 'lucide-react'
import { useThemeColors } from '../hooks/useThemeColors'
import NavBar from '../components/NavBar'

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  timeAgo: string;
  action?: {
    label: string;
    action: string;
  };
}

const Notifications: React.FC = () => {
  const navigate = useNavigate()
  const colors = useThemeColors()
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState<Notification[]>([
    // Sample data - replace with actual notifications
  ])

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'circles', label: 'Circles' },
    { id: 'goals', label: 'Goals' },
    { id: 'payments', label: 'Payments' }
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <>
      <NavBar 
        variant="tabs"
        onBack={() => navigate(-1)}
        title="Notifications"
        titleIcon={<Bell size={20} />}
        subtitle={unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
        badge={unreadCount}
        colors={colors}
        actionButtonText={unreadCount > 0 ? 'Mark All Read' : undefined}
        onActionClick={handleMarkAllAsRead}
      />

      <div className='min-h-screen' style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'text-white'
                    : ''
                }`}
                style={activeTab === tab.id ? { background: colors.gradient } : { backgroundColor: colors.infoBg, color: colors.textLight }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <h2>Notifications</h2> 
        </div>
      </div>
    </>
  )
}

export default Notifications
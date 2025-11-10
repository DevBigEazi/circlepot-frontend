import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
}

interface NavBarProps {
  title?: string;
  titleIcon?: React.ReactNode;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  colors: {
    surface: string;
    border: string;
    text: string;
    textLight?: string;
    primary?: string;
    gradient?: string;
    infoBg?: string;
  };
  userName?: string;
  fullName?: string;
  profileImage?: string | null;
  variant?: 'default' | 'minimal' | 'tabs';
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  badge?: number;
  onActionClick?: () => void;
  actionButtonText?: string;
}

// get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const NavBar: React.FC<NavBarProps> = ({  
  title,
  titleIcon,
  subtitle,
  onBack, 
  actions, 
  colors, 
  userName = 'User',
  fullName = 'No Name',
  profileImage = null,
  variant = 'default',
  badge = 0,
  onActionClick,
  actionButtonText
}) => {
  const userInitials = fullName
  ? fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(name => name.charAt(0).toUpperCase())
      .join('')
  : 'NN';
  
  // Tabs variant (for pages like Notifications)
  if (variant === 'tabs') {
    return (
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 rounded-xl transition hover:opacity-80"
                  style={{ color: colors.text }}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {title && (
                <div className="flex items-center gap-3">
                  {titleIcon && (
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <div style={{ color: 'white' }}>
                        {titleIcon}
                      </div>
                      {badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: colors.text }}>{title}</h1>
                    {subtitle && (
                      <p className="text-sm" style={{ color: colors.textLight }}>
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {actionButtonText && (
              <button 
                onClick={onActionClick}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition border hover:opacity-80"
                style={{ borderColor: colors.border, color: colors.text }}
              >
                {actionButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Minimal variant (for pages like TransactionsHistory)
  if (variant === 'minimal') {
    return (
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 rounded-xl transition hover:opacity-80"
                  style={{ color: colors.text }}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {title && (
                <div className="flex items-center gap-3">
                  {titleIcon && (
                    <div style={{ color: colors.primary }}>
                      {titleIcon}
                    </div>
                  )}
                  <h1 className="text-xl font-bold" style={{ color: colors.text }}>{title}</h1>
                </div>
              )}
            </div>
            <div className="flex gap-2">{actions}</div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant (with user greeting and profile)
  return (
    <header className="sticky top-0 z-40 shadow-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {onBack && (
              <button onClick={onBack} className="p-2 mr-2 rounded-xl transition hover:opacity-80">
                <ArrowLeft size={20} style={{ color: colors.text }} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center text-white text-lg font-bold" style={{ borderColor: colors.text }}>
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                    {userInitials}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: colors.text }}>{getGreeting()}, {userName}</div>
                <div className="text-xs" style={{ color: colors.text, opacity: 0.7 }}>Let's make today count! 💫</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">{actions}</div>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
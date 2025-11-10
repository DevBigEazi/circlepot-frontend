import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface NavBarProps {
  title?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  colors: {
    surface: string;
    border: string;
    text: string;
  };
  userName?: string;
  fullName?: string;
  profileImage?: string | null;
}

// get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const NavBar: React.FC<NavBarProps> = ({  
  onBack, 
  actions, 
  colors, 
  userName = 'User',
  fullName = 'No Name',
  profileImage = null
}) => {
  const userInitials = fullName
  ? fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(name => name.charAt(0).toUpperCase())
      .join('')
  : 'NN';
  
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
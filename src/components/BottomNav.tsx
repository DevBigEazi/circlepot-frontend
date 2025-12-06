import React from "react";
import { Users, Search, Plus, Home } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { Link, useLocation } from "react-router";

const BottomNav: React.FC = () => {
  const colors = useThemeColors();
  const location = useLocation();

  const navItems = [
    { id: "dashboard", icon: Home, label: "Home", route: "/" },
    { id: "browse", icon: Search, label: "Browse", route: "/browse" },
    { id: "create", icon: Plus, label: "Create", route: "/create" },
    { id: "circles", icon: Users, label: "Circles", route: "/circles" },
  ];

  const isActive = (route: string) => {
    if (route === "/") {
      // Match / or any dashboard/:userId route
      return location.pathname === "/" || location.pathname.startsWith("/dashboard/");
    }
    return location.pathname === route;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-40"
      style={{
        backgroundColor: `${colors.surface}F2`,
        borderColor: colors.border,
      }}
    >
      <div className="flex justify-around max-w-7xl mx-auto p-3">
        {navItems.map((item) => (
          <Link
            to={item.route}
            key={item.id}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 flex-1"
            style={
              isActive(item.route)
                ? { backgroundColor: colors.successBg, color: colors.primary }
                : { color: colors.textLight }
            }
          >
            <item.icon
              size={20}
              strokeWidth={isActive(item.route) ? 2.5 : 2}
            />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
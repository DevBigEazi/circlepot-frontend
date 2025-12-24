import React from "react";
import { Outlet, useLocation } from "react-router";
import BottomNav from "../components/BottomNav";

const Layout: React.FC = () => {
  const location = useLocation();
  const { pathname } = location;

  const showBottomNav =
    pathname === "/" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/browse" ||
    pathname === "/create" ||
    pathname === "/circles";

  return (
    <>
      <Outlet />
      {showBottomNav && <BottomNav />}
    </>
  );
};

export default Layout;

import React from "react";
import { Outlet } from "react-router";
import BottomNav from "../components/BottomNav";

const Layout: React.FC = () => {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
};

export default Layout;

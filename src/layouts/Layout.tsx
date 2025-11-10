import React from "react";
import { Outlet } from "react-router";
import BottomNav from "../components/BottomNav";
import TopNav from "../components/TopNav";

const Layout: React.FC = () => {
  return (
    <>
      <TopNav />
      <Outlet />
      <BottomNav />
    </>
  );
};

export default Layout;

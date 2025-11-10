import React from 'react'
import { Outlet } from 'react-router'
import BottomNav from '../components/BottomNav'

const BrowseLayout: React.FC = () => {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

export default BrowseLayout
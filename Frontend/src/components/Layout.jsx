import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Navbar - Fixed at top */}
      <Navbar 
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={sidebarOpen}
      />
      
      {/* Sidebar - Fixed position */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main content area - Properly offset for sidebar */}
      <div className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <main className="p-6 max-w-full min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

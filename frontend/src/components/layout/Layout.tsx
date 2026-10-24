import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const openMobileSidebar = () => setMobileSidebarOpen(true);

  return (
    <div className="min-h-screen bg-secondary-50 selection:bg-blue-100 selection:text-navy-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        isMobile={isMobile && mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />
      <TopNav
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onOpenMobileSidebar={openMobileSidebar}
      />
      <main
        className={`
          pt-16 min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
        role="main"
      >
        <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto animate-fade-in" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

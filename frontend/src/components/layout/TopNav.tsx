import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X, ChevronDown, Settings, Bell as BellIcon, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { alertApi } from '../../api/endpoints';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TopNavProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['alerts-unread-count'],
    queryFn: async () => {
      const res = await alertApi.getUnreadCount();
      return res.data?.count || 0;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await alertApi.list({ page: 1, size: 5, status: 'UNREAD' });
      return (res.data as unknown) as { content: any[] };
    },
    enabled: showNotifications,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => alertApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      // Error handled silently
    },
  });

  const unreadCountValue = unreadCount ?? 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/products': 'Products',
      '/inventory': 'Inventory',
      '/customers': 'Customers',
      '/orders': 'Orders',
      '/sales': 'Sales',
      '/payments': 'Payments',
      '/suppliers': 'Suppliers',
      '/invoices': 'Invoices',
      '/expenses': 'Expenses',
      '/alerts': 'Alerts',
      '/copilot': 'AI Copilot',
      '/settings': 'Settings',
    };
    return titles[path] || 'ThreadPilot AI';
  };

  const getPageDescription = () => {
    const path = location.pathname;
    const descriptions: Record<string, string> = {
      '/dashboard': 'Overview of your business performance',
      '/products': 'Manage your product catalog and variants',
      '/inventory': 'Track stock levels, movements, and valuations',
      '/customers': 'Manage customer relationships and credit',
      '/orders': 'Track customer orders and fulfillment',
      '/sales': 'Record and analyze sales transactions',
      '/payments': 'Record customer and supplier payments',
      '/suppliers': 'Manage supplier relationships and payables',
      '/invoices': 'Manage supplier invoices and OCR processing',
      '/expenses': 'Track business expenses and categories',
      '/alerts': 'View and manage business alerts',
      '/copilot': 'Chat with your AI business assistant',
      '/settings': 'Configure your organization and preferences',
    };
    return descriptions[path] || '';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16 bg-white border-b border-secondary-200
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'left-16' : 'left-64'}
      `}
      role="banner"
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={!sidebarCollapsed}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-secondary-900">{getPageTitle()}</h1>
            <p className="text-xs text-secondary-500 truncate max-w-xs">{getPageDescription()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                }
              }}
              className="relative p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCountValue > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                  {unreadCountValue > 9 ? '9+' : unreadCountValue}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-secondary-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-secondary-200 flex items-center justify-between">
                  <h3 className="font-medium text-secondary-900">Notifications</h3>
                  {unreadCountValue > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs p-1"
                      onClick={() => {
                        markAllReadMutation.mutate();
                        setShowNotifications(false);
                      }}
                      disabled={markAllReadMutation.isPending}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-4 text-center text-secondary-500 text-sm flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading notifications...
                    </div>
                  ) : notificationsData?.content?.length === 0 ? (
                    <div className="px-4 py-4 text-center text-secondary-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-secondary-200">
                      {notificationsData?.content?.map((alert) => (
                        <button
                          key={alert.id}
                          onClick={() => {
                            if (alert.actionUrl) {
                              navigate(alert.actionUrl);
                            }
                            setShowNotifications(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 truncate">{alert.title}</p>
                            <p className="text-xs text-secondary-500 truncate">{alert.message}</p>
                            <p className="text-xs text-secondary-400 mt-1">
                              {new Date(alert.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 transition-colors"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-secondary-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-secondary-500">{organization?.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-secondary-500 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-secondary-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-secondary-200">
                  <p className="text-sm font-medium text-secondary-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <hr className="my-1 border-secondary-200" />
                <button
                  onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Logout"
        size="sm"
      >
        <p className="text-secondary-600 mb-6">Are you sure you want to log out?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Modal>
    </header>
  );
};

export default TopNav;
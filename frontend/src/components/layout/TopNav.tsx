import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
  Bell as BellIcon,
  User,
  LogOut,
  Menu,
  ChevronDown,
  Settings,
  Check,
  Loader2,
  Sparkles,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { alertApi, searchApi } from '../../api/endpoints';
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
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    products?: any[];
    variants?: any[];
    customers?: any[];
    suppliers?: any[];
    orders?: any[];
    invoices?: any[];
    sales?: any[];
    total?: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim().length >= 2) {
          setShowSearchDropdown(true);
        }
      } else if (e.key === 'Escape') {
        setShowSearchDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchApi.search(searchQuery.trim());
        setSearchResults(res.data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: unreadCount } = useQuery({
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
      '/copilot': 'Thread AI',
      '/thread-ai': 'Thread AI',
      '/settings': 'Settings',
    };
    return titles[path] || 'ThreadPilot AI';
  };

  const getPageDescription = () => {
    const path = location.pathname;
    const descriptions: Record<string, string> = {
      '/dashboard': 'Enterprise operations & real-time business health',
      '/products': 'Catalog variants, pricing, and master product records',
      '/inventory': 'Stock levels, warehouse movements, and low-stock alerts',
      '/customers': 'Customer accounts, credit limits, and receivable balances',
      '/orders': 'Customer order pipeline, fulfillment, and dispatch',
      '/sales': 'Revenue transactions, payment terms, and invoicing',
      '/payments': 'Customer and supplier transaction vouchers',
      '/suppliers': 'Vendor profiles, payables ledger, and purchase orders',
      '/invoices': 'Supplier invoices with automated OCR extraction',
      '/expenses': 'Operational expenditure ledger and category analytics',
      '/alerts': 'Real-time operational alerts and critical events',
      '/copilot': 'Autonomous operational intelligence & commercial ledger advisor',
      '/thread-ai': 'Autonomous operational intelligence & commercial ledger advisor',
      '/settings': 'Organization parameters, team access, and audit preferences',
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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitials =
    `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-secondary-200/90
        transition-all duration-300 ease-in-out select-none
        ${sidebarCollapsed ? 'left-16' : 'left-64'}
      `}
      role="banner"
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-secondary-500 hover:text-navy-900 hover:bg-secondary-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={!sidebarCollapsed}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-navy-900 tracking-tight">
                {getPageTitle()}
              </h1>
              <span className="hidden md:inline-block w-1 h-1 rounded-full bg-secondary-300" />
              <p className="hidden md:block text-xs text-secondary-500 truncate max-w-sm">
                {getPageDescription()}
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md mx-4 hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
              }}
              placeholder="Search products, orders, customers, invoices... (Press /)"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-secondary-50 hover:bg-secondary-100/70 focus:bg-white text-secondary-900 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-secondary-400"
            />
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-secondary-400 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-secondary-200/90 py-2 z-50 max-h-96 overflow-y-auto divide-y divide-secondary-100">
              {searchResults.total === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-secondary-500">
                  No records found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {searchResults.products && searchResults.products.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-400">Products</div>
                      {searchResults.products.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate('/products');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-secondary-50 flex flex-col"
                        >
                          <span className="text-xs font-medium text-navy-900">{item.title}</span>
                          <span className="text-[10px] text-secondary-500">{item.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.customers && searchResults.customers.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-400">Customers</div>
                      {searchResults.customers.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate('/customers');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-secondary-50 flex flex-col"
                        >
                          <span className="text-xs font-medium text-navy-900">{item.title}</span>
                          <span className="text-[10px] text-secondary-500">{item.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.orders && searchResults.orders.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-400">Orders</div>
                      {searchResults.orders.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate('/orders');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-secondary-50 flex flex-col"
                        >
                          <span className="text-xs font-medium text-navy-900 font-mono">{item.title}</span>
                          <span className="text-[10px] text-secondary-500">{item.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.invoices && searchResults.invoices.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-400">Supplier Invoices</div>
                      {searchResults.invoices.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate('/invoices');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-secondary-50 flex flex-col"
                        >
                          <span className="text-xs font-medium text-navy-900 font-mono">{item.title}</span>
                          <span className="text-[10px] text-secondary-500">{item.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.suppliers && searchResults.suppliers.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-400">Suppliers</div>
                      {searchResults.suppliers.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate('/suppliers');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-secondary-50 flex flex-col"
                        >
                          <span className="text-xs font-medium text-navy-900">{item.title}</span>
                          <span className="text-[10px] text-secondary-500">{item.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.sales && searchResults.sales.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-400">Sales</div>
                      {searchResults.sales.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate('/sales');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-secondary-50 flex flex-col"
                        >
                          <span className="text-xs font-medium text-navy-900 font-mono">{item.title}</span>
                          <span className="text-[10px] text-secondary-500">{item.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick AI shortcut button */}
          <NavLink
            to="/thread-ai"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-navy-950 bg-gradient-to-r from-brass-50 to-stone-50 border border-brass-200/90 hover:border-brass-400 hover:shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-brass-600" />
            <span>Thread AI</span>
          </NavLink>

          {/* Notifications Popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                }
              }}
              className="relative p-2 rounded-lg text-secondary-500 hover:text-navy-900 hover:bg-secondary-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <BellIcon className="w-4.5 h-4.5" />
              {unreadCountValue > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums shadow-xs">
                  {unreadCountValue > 99 ? '99+' : unreadCountValue}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-xl border border-secondary-200/90 py-2 z-50 animate-scale-in">
                <div className="px-4 py-2.5 border-b border-secondary-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                      Notifications
                    </h3>
                    {unreadCountValue > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {unreadCountValue} unread
                      </span>
                    )}
                  </div>
                  {unreadCountValue > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs py-1 px-2 h-auto text-secondary-600 hover:text-navy-900"
                      onClick={() => {
                        markAllReadMutation.mutate();
                        setShowNotifications(false);
                      }}
                      disabled={markAllReadMutation.isPending}
                    >
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-secondary-100/80 scrollbar-thin">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center text-secondary-500 text-xs flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-navy-900" />
                      Loading notifications...
                    </div>
                  ) : notificationsData?.content?.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs font-medium text-secondary-600">All caught up</p>
                      <p className="text-[11px] text-secondary-400 mt-0.5">No unread alerts requiring attention</p>
                    </div>
                  ) : (
                    notificationsData?.content?.map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => {
                          if (alert.actionUrl) {
                            navigate(alert.actionUrl);
                          }
                          setShowNotifications(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-secondary-50/80 transition-colors flex items-start gap-3 group"
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mt-0.5">
                          <BellIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-secondary-900 group-hover:text-navy-900 truncate">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-secondary-500 truncate mt-0.5">
                            {alert.message}
                          </p>
                          <p className="text-[10px] text-secondary-400 mt-1 tabular-nums">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold text-xs tracking-wider border border-navy-800 shadow-xs">
                {userInitials}
              </div>
              <div className="hidden md:block text-left leading-none">
                <p className="text-xs font-bold text-navy-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-secondary-500 mt-0.5 font-medium">
                  {organization?.name || 'Organization'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-secondary-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg shadow-xl border border-secondary-200/90 py-1.5 z-50 animate-fade-in animate-scale-in">
                <div className="px-3.5 py-2.5 border-b border-secondary-100 bg-secondary-50/50">
                  <p className="text-xs font-bold text-navy-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-secondary-500 truncate mt-0.5">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-secondary-700 hover:bg-secondary-50 hover:text-navy-900 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-secondary-500" />
                    <span>Settings & Organization</span>
                  </button>
                </div>

                <div className="border-t border-secondary-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Logout Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Logout"
        size="sm"
      >
        <p className="text-xs sm:text-sm text-secondary-600 mb-6">
          Are you sure you want to end your current session? You will need to sign in again to access ThreadPilot AI.
        </p>
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => setShowLogoutConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Modal>
    </header>
  );
};

export default TopNav;

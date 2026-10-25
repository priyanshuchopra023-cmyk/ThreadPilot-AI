import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Truck,
  FileSpreadsheet,
  Receipt,
  BellRing,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThreadPilotLogo } from '../brand/ThreadPilotLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navSections: Array<{ label?: string; items: NavItem[] }> = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Inventory', href: '/inventory', icon: Layers },
    ],
  },
  {
    label: 'Commerce & Sales',
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Orders', href: '/orders', icon: ShoppingCart },
      { name: 'Sales', href: '/sales', icon: TrendingUp },
    ],
  },
  {
    label: 'Financials & Supply',
    items: [
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
      { name: 'Invoices', href: '/invoices', icon: FileSpreadsheet },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Expenses', href: '/expenses', icon: Receipt },
    ],
  },
  {
    label: 'Operations & AI',
    items: [
      { name: 'Alerts', href: '/alerts', icon: BellRing },
      { name: 'Thread AI', href: '/thread-ai', icon: Sparkles, badge: 'AI' },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggle,
  isMobile = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { organization, user } = useAuth();

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen bg-white border-r border-secondary-200/90 shadow-sm
          transition-all duration-300 ease-in-out flex flex-col justify-between select-none
          ${collapsed ? 'w-16' : 'w-64'}
          ${isMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Brand Bar */}
          <div className="flex items-center justify-between h-16 px-3.5 border-b border-secondary-200/80 bg-secondary-50/40">
            {collapsed ? (
              <NavLink
                to="/dashboard"
                className="mx-auto flex items-center justify-center p-1 rounded-lg hover:bg-secondary-100 transition-colors"
                title="ThreadPilot AI Dashboard"
              >
                <ThreadPilotLogo variant="symbol" size="sm" />
              </NavLink>
            ) : (
              <NavLink
                to="/dashboard"
                className="flex items-center gap-2 pl-1 group"
                aria-label="ThreadPilot AI Dashboard"
              >
                <ThreadPilotLogo variant="full" size="md" />
              </NavLink>
            )}

            <button
              onClick={onToggle}
              className={`
                p-1.5 rounded-lg text-secondary-400 hover:text-navy-900 hover:bg-secondary-100 transition-colors
                ${collapsed ? 'hidden lg:flex mx-auto mt-2' : 'hidden lg:flex'}
              `}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {isMobile && !collapsed && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-secondary-400 hover:text-navy-900 hover:bg-secondary-100 transition-colors lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Section List */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin" aria-label="Main navigation">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {!collapsed && section.label && (
                  <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-secondary-400">
                    {section.label}
                  </p>
                )}
                <ul className="space-y-0.5" role="list">
                  {section.items.map((item) => {
                    const isAiMatch = (item.href === '/thread-ai' || item.href === '/copilot') &&
                      (location.pathname === '/thread-ai' || location.pathname === '/copilot');
                    const isActive =
                      isAiMatch ||
                      location.pathname === item.href ||
                      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          onClick={onCloseMobile}
                          className={({ isActive: active }) => `
                            group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
                            ${
                              active
                                ? 'bg-navy-900 text-white shadow-xs font-semibold'
                                : 'text-secondary-600 hover:bg-secondary-100/80 hover:text-navy-900'
                            }
                            ${collapsed ? 'justify-center px-2 py-2.5' : ''}
                          `}
                          title={collapsed ? item.name : undefined}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                              isActive ? 'text-brass-400' : 'text-secondary-500 group-hover:text-navy-900'
                            }`}
                            aria-hidden="true"
                          />
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 bg-brass-400 rounded-r-sm" />
                          )}
                          {!collapsed && (
                            <span className="flex-1 truncate tracking-tight">{item.name}</span>
                          )}
                          {!collapsed && item.badge && (
                            <span
                              className={`
                                px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider
                                ${
                                  isActive
                                    ? 'bg-brass-400/20 text-brass-300 border border-brass-400/30'
                                    : 'bg-brass-50 text-brass-700 border border-brass-200'
                                }
                              `}
                            >
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Organization & User Profile Badge Card */}
          {!collapsed && organization && (
            <div className="p-3 border-t border-secondary-200/80 bg-secondary-50/50">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-secondary-200/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-brass-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-navy-900 truncate tracking-tight">
                    {organization.name}
                  </p>
                  <p className="text-[10px] text-secondary-500 font-mono">
                    ID: {organization.code}
                  </p>
                </div>
              </div>

              {user && (
                <div className="mt-2.5 pt-2 border-t border-secondary-200/60 flex items-center justify-between text-xs text-secondary-500 px-1">
                  <span className="truncate max-w-[150px] font-medium text-secondary-700">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-secondary-200/70 text-secondary-700">
                    {user.roles?.[0]?.name || 'Member'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

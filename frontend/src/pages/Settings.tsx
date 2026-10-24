import React, { useState } from 'react';
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Download, 
  Upload, 
  Key, 
  Trash2, 
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  Lock
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { organizationApi, authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, organization, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [orgData, setOrgData] = useState({
    name: organization?.name || '',
    code: organization?.code || '',
    gstNumber: organization?.gstNumber || '',
    address: organization?.address || '',
    city: organization?.city || '',
    state: organization?.state || '',
    postalCode: organization?.postalCode || '',
    phone: organization?.phone || '',
    email: organization?.email || '',
  });
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    lowStockAlerts: true,
    paymentReminders: true,
    weeklyReports: false,
  });

  useQuery({
    queryKey: ['organization-current'],
    queryFn: async () => {
      const res = await organizationApi.getCurrent();
      if (res.data) {
        setOrgData(prev => ({
          ...prev,
          name: res.data?.name || prev.name,
          code: res.data?.code || prev.code,
          gstNumber: res.data?.gstNumber || prev.gstNumber,
          address: res.data?.address || prev.address,
          city: res.data?.city || prev.city,
          state: res.data?.state || prev.state,
          postalCode: res.data?.postalCode || prev.postalCode,
          phone: res.data?.phone || prev.phone,
          email: res.data?.email || prev.email,
        }));
      }
      return res.data;
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data: Partial<typeof orgData>) => organizationApi.update(data),
    onSuccess: () => {
      toast.success('Organization parameters updated successfully');
      refreshUser();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update organization');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword?.(data) || Promise.reject(new Error('Not implemented')),
    onSuccess: () => {
      toast.success('Security password updated');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    },
  });

  const validatePassword = () => {
    const errors: Record<string, string> = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    changePasswordMutation.mutate({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate(orgData);
  };

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: <User className="w-4 h-4" /> },
    { id: 'organization', label: 'Organization', icon: <Building className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Auth', icon: <Shield className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'data', label: 'Data Management', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Organization profile, multi-tenant configurations, user access control, and notification rules"
        breadcrumbs={[
          { label: 'System' },
          { label: 'Settings' },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-navy-100 p-2 shadow-card" aria-label="Settings navigation">
            <ul className="space-y-1" role="list">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-navy-900 text-white shadow-sm'
                        : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader title="Account Profile" description="Your personal operator credentials" />
              <CardBody className="p-6">
                <div className="space-y-6 max-w-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-navy-900 text-brass-400 font-bold text-xl rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-navy-700">
                      {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-navy-900">{user?.firstName} {user?.lastName}</h3>
                        <Badge variant="brass" size="sm">
                          {user?.roles?.[0]?.name || 'Admin'}
                        </Badge>
                      </div>
                      <p className="text-xs text-navy-500 mt-0.5">{user?.email}</p>
                      <p className="text-[11px] text-navy-400 font-mono mt-1">Tenant ID: {organization?.code || 'SC'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-navy-100">
                    <Input label="First Name" value={user?.firstName || ''} disabled />
                    <Input label="Last Name" value={user?.lastName || ''} disabled />
                    <Input label="Email Address" type="email" value={user?.email || ''} disabled />
                    <Input label="Phone Number" value={user?.phone || 'Not recorded'} disabled />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'organization' && (
            <Card>
              <CardHeader title="Organization Profile" description="Legal manufacturing entity and billing parameters" />
              <CardBody className="p-6">
                <form onSubmit={handleOrgSubmit} className="space-y-5 max-w-2xl">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">
                      Entity Legal Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Input 
                        label="Organization Name *" 
                        name="name" 
                        value={orgData.name} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        error={orgErrors.name} 
                        placeholder="ThreadPilot Manufacturing Ltd." 
                      />
                      <Input 
                        label="Organization Tenant Code *" 
                        name="code" 
                        value={orgData.code} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        error={orgErrors.code} 
                        placeholder="ORG" 
                        maxLength={10} 
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">
                      Tax & Registered Address
                    </h4>
                    <Input 
                      label="GSTIN" 
                      name="gstNumber" 
                      value={orgData.gstNumber} 
                      onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                      placeholder="03AAAAA0000A1Z5" 
                    />
                    <div className="mt-3.5">
                      <Input 
                        label="Plant / Office Address" 
                        name="address" 
                        value={orgData.address} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        placeholder="Industrial Area B, Ludhiana" 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
                      <Input 
                        label="City" 
                        name="city" 
                        value={orgData.city} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        placeholder="Ludhiana" 
                      />
                      <Input 
                        label="State" 
                        name="state" 
                        value={orgData.state} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        placeholder="Punjab" 
                      />
                      <Input 
                        label="PIN Code" 
                        name="postalCode" 
                        value={orgData.postalCode} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        placeholder="141003" 
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">
                      Official Contact Coordinates
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Input 
                        label="Official Phone" 
                        name="phone" 
                        value={orgData.phone} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        placeholder="+91 161 5000000" 
                        type="tel" 
                      />
                      <Input 
                        label="Billing Email" 
                        name="email" 
                        type="email" 
                        value={orgData.email} 
                        onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} 
                        placeholder="accounts@threadpilot.com" 
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
                    <Button 
                      type="submit" 
                      variant="primary"
                      loading={updateOrgMutation.isPending}
                    >
                      Save Configuration
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader title="Notification Preferences" description="Configure alert channels and event thresholds" />
              <CardBody className="p-6">
                <div className="space-y-3.5 max-w-xl">
                  {[
                    { key: 'emailNotifications', label: 'Email Dispatch Notifications', description: 'Receive order confirmation and dispatch events' },
                    { key: 'pushNotifications', label: 'Desktop Alert Banners', description: 'Real-time in-app alerts for system events' },
                    { key: 'lowStockAlerts', label: 'Inventory Depletion Warnings', description: 'Trigger warnings when finished goods drop below minimum' },
                    { key: 'paymentReminders', label: 'Overdue Receivable Reminders', description: 'Automatic prompts for accounts overdue past Net terms' },
                    { key: 'weeklyReports', label: 'Executive Operations Digest', description: 'Weekly analytical summary of margins and stock turnover' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3.5 bg-navy-50/50 border border-navy-100/80 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-navy-900">{item.label}</p>
                        <p className="text-[11px] text-navy-500 mt-0.5">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="w-4 h-4 rounded border-navy-300 text-navy-800 focus:ring-navy-600"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader title="Security & Authentication" description="Credentials, password rotation, and session management" />
              <CardBody className="p-6">
                <div className="space-y-6 max-w-xl">
                  <div className="p-4 bg-navy-50/70 border border-navy-100 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-navy-900">Operator Password</h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">Change your account credentials periodically for security</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setShowChangePassword(true)} 
                      leftIcon={<Key className="w-3.5 h-3.5" />}
                    >
                      Rotate Password
                    </Button>
                  </div>

                  <div className="p-4 bg-white border border-navy-100 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-navy-900">Tenant Isolation & RBAC</h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">Strict organization-level multi-tenant database partitioning</p>
                    </div>
                    <Badge variant="success" size="sm" dot>Enforced</Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader title="Appearance & Layout" description="Theme and display density settings" />
              <CardBody className="p-6">
                <div className="space-y-5 max-w-xl">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">Theme Palette</h4>
                    <div className="p-4 rounded-xl border-2 border-navy-800 bg-navy-50/40 max-w-xs">
                      <div className="w-full h-12 rounded bg-navy-900 border border-navy-700 flex items-center justify-center text-brass-400 font-bold text-xs mb-2">
                        Deep Navy & Warm Brass
                      </div>
                      <p className="text-xs font-bold text-navy-900">Enterprise High-Contrast (Active)</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card>
              <CardHeader title="Data Management" description="Enterprise backup and data migration" />
              <CardBody className="p-6">
                <div className="space-y-4 max-w-xl">
                  <div className="p-4 border border-navy-100 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-navy-900">Export Ledger</h4>
                      <p className="text-[11px] text-navy-500 mt-0.5">Download full JSON snapshot of catalogue, orders, and sales</p>
                    </div>
                    <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      Export
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => { setShowChangePassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordErrors({}); }}
        title="Rotate Operator Password"
        size="sm"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
          <Input
            label="Current Password *"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            error={passwordErrors.currentPassword}
            placeholder="••••••••"
          />
          <Input
            label="New Password *"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            error={passwordErrors.newPassword}
            placeholder="••••••••"
          />
          <Input
            label="Confirm New Password *"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            error={passwordErrors.confirmPassword}
            placeholder="••••••••"
          />
          <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
            <Button type="button" variant="secondary" onClick={() => { setShowChangePassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={changePasswordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;

import React, { useState, FormEvent } from 'react';
import { User, Building, Bell, Shield, Palette, Database, Download, Upload, Key, Trash2, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { organizationApi, authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SettingsTabProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ icon, label, children }) => (
  <div className="space-y-6">{children}</div>
);

export const Settings: React.FC = () => {
  const { user, organization, refreshUser } = useAuth();
  const queryClient = useQueryClient();
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

  const { data: orgResponse } = useQuery({
    queryKey: ['organization-current'],
    queryFn: () => organizationApi.getCurrent(),
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data: Partial<typeof orgData>) => organizationApi.update(data),
    onSuccess: () => {
      toast.success('Organization updated');
      refreshUser();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update organization');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword?.(data) || Promise.reject(new Error('Not implemented')),
    onSuccess: () => {
      toast.success('Password changed');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
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
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'organization', label: 'Organization', icon: <Building className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-secondary-200 p-2" aria-label="Settings navigation">
            <ul className="space-y-1" role="list">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
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

        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-secondary-900">Profile</h2>
                <p className="text-secondary-600 mt-1">Manage your personal information</p>
              </CardHeader>
              <CardBody>
                <form className="space-y-4 max-w-md">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-10 h-10 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900">{user?.firstName} {user?.lastName}</h3>
                      <p className="text-secondary-500">{user?.email}</p>
                      <p className="text-sm text-secondary-400">Member since {new Date(user?.createdAt || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary-200">
                    <Input label="First Name" value={user?.firstName || ''} disabled />
                    <Input label="Last Name" value={user?.lastName || ''} disabled />
                    <Input label="Email" type="email" value={user?.email || ''} disabled />
                    <Input label="Phone" value={user?.phone || ''} disabled />
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {activeTab === 'organization' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-secondary-900">Organization</h2>
                <p className="text-secondary-600 mt-1">Manage organization details</p>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleOrgSubmit} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Organization Name *" name="name" value={orgData.name} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} error={orgErrors.name} placeholder="Acme Corporation" />
                    <Input label="Organization Code *" name="code" value={orgData.code} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} error={orgErrors.code} placeholder="ACME" maxLength={10} />
                  </div>
                  <Input label="GST Number" name="gstNumber" value={orgData.gstNumber} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} placeholder="GST Number" />
                  <Input label="Address" name="address" value={orgData.address} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} placeholder="Address" />
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="City" name="city" value={orgData.city} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} placeholder="City" />
                    <Input label="State" name="state" value={orgData.state} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} placeholder="State" />
                    <Input label="Postal Code" name="postalCode" value={orgData.postalCode} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} placeholder="Postal Code" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Phone" name="phone" value={orgData.phone} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} placeholder="Phone" type="tel" />
                    <Input label="Email" name="email" type="email" value={orgData.email} onChange={(e) => setOrgData({ ...orgData, [e.target.name]: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                    <Button type="submit" loading={updateOrgMutation.isPending}>Save Changes</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-secondary-900">Notifications</h2>
                <p className="text-secondary-600 mt-1">Configure how you receive notifications</p>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 max-w-md">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Get alerted when inventory runs low' },
                    { key: 'paymentReminders', label: 'Payment Reminders', description: 'Reminders for upcoming and overdue payments' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly business summary reports' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">{item.label}</p>
                        <p className="text-sm text-secondary-500">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-secondary-900">Security</h2>
                <p className="text-secondary-600 mt-1">Manage password and security settings</p>
              </CardHeader>
              <CardBody>
                <div className="space-y-6 max-w-md">
                  <div>
                    <h3 className="font-medium text-secondary-900 mb-3">Change Password</h3>
                    <Button variant="secondary" onClick={() => setShowChangePassword(true)} leftIcon={<Key className="w-4 h-4" />}>
                      Change Password
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-medium text-secondary-900 mb-3">Two-Factor Authentication</h3>
                    <p className="text-secondary-600 mb-3">Add an extra layer of security to your account</p>
                    <Button variant="secondary" leftIcon={<Shield className="w-4 h-4" />}>Enable 2FA</Button>
                  </div>
                  <div>
                    <h3 className="font-medium text-secondary-900 mb-3">Active Sessions</h3>
                    <p className="text-secondary-600 mb-3">Manage your active login sessions</p>
                    <Button variant="ghost" className="text-red-600 hover:bg-red-50" leftIcon={<Trash2 className="w-4 h-4" />}>
                      Log out of all other sessions
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-secondary-900">Appearance</h2>
                <p className="text-secondary-600 mt-1">Customize how ThreadPilot looks</p>
              </CardHeader>
              <CardBody>
                <div className="space-y-6 max-w-md">
                  <div>
                    <h3 className="font-medium text-secondary-900 mb-3">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {['light', 'dark', 'system'].map((theme) => (
                        <button
                          key={theme}
                          className={`p-4 rounded-lg border-2 transition-colors ${theme === 'light' ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:border-secondary-300'}`}
                        >
                          <div className={`w-full h-16 rounded ${theme === 'dark' ? 'bg-secondary-900' : 'bg-white'} border border-secondary-200 mb-2`} />
                          <p className="text-sm font-medium capitalize text-secondary-900">{theme}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-secondary-900 mb-3">Sidebar</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                      <span className="text-sm font-medium text-secondary-700">Collapse sidebar by default</span>
                    </label>
                  </div>
                  <div>
                    <h3 className="font-medium text-secondary-900 mb-3">Density</h3>
                    <Select
                      value="comfortable"
                      onChange={() => {}}
                      options={[
                        { value: 'compact', label: 'Compact' },
                        { value: 'comfortable', label: 'Comfortable' },
                        { value: 'spacious', label: 'Spacious' },
                      ]}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-secondary-900">Data Management</h2>
                <p className="text-secondary-600 mt-1">Export, import, or delete your data</p>
              </CardHeader>
              <CardBody>
                <div className="space-y-6 max-w-2xl">
                  <div className="p-4 border border-secondary-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-secondary-900">Export Data</h3>
                        <p className="text-secondary-600 text-sm">Download all your business data as JSON</p>
                      </div>
                      <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Export All Data</Button>
                    </div>
                  </div>
                  <div className="p-4 border border-secondary-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-secondary-900">Import Data</h3>
                        <p className="text-secondary-600 text-sm">Import data from a previous export</p>
                      </div>
                      <Button variant="secondary" leftIcon={<Upload className="w-4 h-4" />}>Import Data</Button>
                    </div>
                  </div>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-red-900">Delete Account</h3>
                        <p className="text-red-600 text-sm">Permanently delete your account and all data. This action cannot be undone.</p>
                      </div>
                      <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>Delete Account</Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={showChangePassword}
        onClose={() => { setShowChangePassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordErrors({}); }}
        title="Change Password"
        size="sm"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              error={passwordErrors.currentPassword}
              placeholder="••••••••"
              rightIcon={
                <button type="button" className="text-secondary-400 hover:text-secondary-600">
                  <Eye className="w-5 h-5" />
                </button>
              }
            />
          </div>
          <div className="relative">
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              error={passwordErrors.newPassword}
              placeholder="••••••••"
              rightIcon={
                <button type="button" className="text-secondary-400 hover:text-secondary-600">
                  <Eye className="w-5 h-5" />
                </button>
              }
            />
          </div>
          <div className="relative">
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              error={passwordErrors.confirmPassword}
              placeholder="••••••••"
              rightIcon={
                <button type="button" className="text-secondary-400 hover:text-secondary-600">
                  <Eye className="w-5 h-5" />
                </button>
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button type="button" variant="secondary" onClick={() => { setShowChangePassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>Cancel</Button>
            <Button type="submit" loading={changePasswordMutation.isPending}>Change Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
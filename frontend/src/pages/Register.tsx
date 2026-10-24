import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThreadPilotLogo } from '../components/brand/ThreadPilotLogo';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
    if (!formData.organizationCode.trim()) newErrors.organizationCode = 'Organization code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(formData);
      toast.success('Organization account created successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 bg-secondary-50 selection:bg-blue-100 selection:text-navy-900">
      {/* Left Column: Brand Hero */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-850 text-white relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-navy-800">
        <div className="relative z-10">
          <ThreadPilotLogo variant="full" theme="dark" size="lg" />
        </div>

        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-brass-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brass-400" />
            <span>Launch Your Organization</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Transform wholesale & factory workflows in minutes.
          </h2>
          <p className="text-sm text-slate-300 font-normal leading-relaxed mb-8">
            Create an isolated multi-tenant organization partition with full inventory tracking, OCR invoice processing, and AI Copilot capability.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>Dedicated tenant database schema isolation</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>Unlimited team seat invites and role-based permissions</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>No credit card required for standard setup</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Ledger Security</span>
          </div>
          <span>ThreadPilot AI 2026</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="flex-1 lg:col-span-7 xl:col-span-6 flex flex-col justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-12 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto">
          <div className="lg:hidden mb-6 text-center">
            <ThreadPilotLogo variant="full" theme="light" size="lg" className="justify-center" />
          </div>

          <div className="bg-white rounded-2xl border border-secondary-200/90 shadow-xl p-8 sm:p-10">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
                Create your organization account
              </h1>
              <p className="text-xs sm:text-sm text-secondary-500 mt-1">
                Start managing wholesale inventory and finance workflows
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  placeholder="Jane"
                  autoComplete="given-name"
                  autoFocus
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>

              <Input
                label="Work Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="jane@company.com"
                autoComplete="email"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-secondary-400 hover:text-navy-900 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </div>

              <div className="pt-3 border-t border-secondary-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-600 mb-3 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-navy-900" />
                  <span>Organization Parameters</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    error={errors.organizationName}
                    placeholder="Apex Hosiery Mills"
                  />
                  <Input
                    label="Organization Code"
                    name="organizationCode"
                    value={formData.organizationCode}
                    onChange={handleChange}
                    error={errors.organizationCode}
                    placeholder="APEX"
                    maxLength={10}
                    helperText="2-8 letters (used for team sign-in)"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-md text-sm py-2.5 font-semibold"
                  loading={loading}
                >
                  Create Organization Account
                </Button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-secondary-100 text-center">
              <p className="text-xs text-secondary-500">
                Already have an organization account?{' '}
                <Link to="/login" className="font-semibold text-navy-900 hover:text-blue-600 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

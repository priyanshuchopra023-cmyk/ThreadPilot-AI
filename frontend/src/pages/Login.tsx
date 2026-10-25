import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThreadPilotLogo } from '../components/brand/ThreadPilotLogo';
import { AuthHeroIllustration } from '../components/brand/AuthHeroIllustration';
import { ThreadWeave3D } from '../components/brand/ThreadWeave3D';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validateField = (name: string, val: string): string => {
    switch (name) {
      case 'email':
        if (!val.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Invalid email format';
        return '';
      case 'password':
        return !val ? 'Password is required' : '';
      case 'organizationCode':
        return !val.trim() ? 'Organization code is required' : '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, val: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, val);
    if (err) {
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    const emailErr = validateField('email', email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validateField('password', password);
    if (passErr) newErrors.password = passErr;
    const orgErr = validateField('organizationCode', organizationCode);
    if (orgErr) newErrors.organizationCode = orgErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setTouched({ email: true, password: true, organizationCode: true });

    if (!validateAll()) return;

    setLoading(true);
    try {
      await login(email, password, organizationCode, rememberMe);
      toast.success('Welcome back to ThreadPilot AI!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getVisibleError = (field: string) => {
    return (touched[field] || hasSubmitted) ? errors[field] : undefined;
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 bg-secondary-50 selection:bg-blue-100 selection:text-navy-900">
      {/* Left Column: Premium Enterprise Hero Panel */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-navy-800">
        {/* Layered background radial glows */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-brass-500/15 blur-3xl pointer-events-none" />

        {/* Ambient Grid Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="tp-login-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tp-login-grid)" />
        </svg>

        {/* Brand Lockup */}
        <div className="relative z-10">
          <ThreadPilotLogo variant="full" theme="dark" size="lg" />
        </div>

        {/* Hero Narrative + 3D Dimensional Illustration */}
        <div className="relative z-10 max-w-xl my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/80 border border-navy-700/80 text-brass-300 text-xs font-semibold uppercase tracking-wider mb-5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-brass-400" />
            <span>Next-Generation Operations OS</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Unified intelligence for hosiery & wholesale enterprise operations.
          </h2>
          <p className="text-sm xl:text-base text-slate-300 font-normal leading-relaxed mb-6">
            Manage inventory valuation, supplier OCR workflows, order fulfillment, and multi-tenant ledger accounts in one continuous, precision-crafted platform.
          </p>

          {/* 3D Dimensional Illustration */}
          <div className="mb-6">
            <AuthHeroIllustration />
          </div>

          {/* Value Proposition Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Automated OCR invoice ingestion</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>Proactive stockout prevention</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Strict organization-level tenant isolation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>Real-time financial telemetry</span>
            </div>
          </div>
        </div>

        {/* Footer Security Assurance */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Multi-Tenant Architecture</span>
          </div>
          <span className="tabular-nums font-mono">v1.0.0-PROD</span>
        </div>
      </div>

      {/* Right Column: Clean, High-Contrast Sign-in Card */}
      <div className="flex-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-16">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Brand Header with 3D Preview */}
          <div className="lg:hidden mb-6 flex flex-col items-center">
            <ThreadPilotLogo variant="full" theme="light" size="lg" className="justify-center mb-3" />
            <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-md border border-navy-800/20 mb-1">
              <ThreadWeave3D intensity="subtle" showTelemetryNodes={false} className="h-28 aspect-auto" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-secondary-200/90 shadow-xl p-8 sm:p-10">
            <div className="mb-6 pb-3 border-b border-secondary-100">
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
                Sign in to your organization
              </h1>
              <p className="text-xs sm:text-sm text-secondary-600 mt-1">
                Enter your credentials to access your business console
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Work Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={(e) => handleBlur('email', e.target.value)}
                error={getVisibleError('email')}
                placeholder="you@company.com"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4 text-secondary-400" />}
                autoFocus
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  error={getVisibleError('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  leftIcon={<Lock className="w-4 h-4 text-secondary-400" />}
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
              </div>

              <Input
                label="Organization Code"
                value={organizationCode}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                  setOrganizationCode(upper);
                  if (errors.organizationCode) setErrors((prev) => ({ ...prev, organizationCode: '' }));
                }}
                onBlur={(e) => handleBlur('organizationCode', e.target.value)}
                error={getVisibleError('organizationCode')}
                placeholder="ORG001"
                autoComplete="off"
                leftIcon={<Building2 className="w-4 h-4 text-secondary-400" />}
                helperText="Ask your workspace administrator for your 2 to 8 character code"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-secondary-300 text-navy-900 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-secondary-700">Remember session</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-navy-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-md hover:shadow-lg text-sm py-3 font-semibold bg-navy-900 hover:bg-navy-800 text-white transition-all rounded-xl group"
                  loading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                >
                  {loading ? 'Authenticating...' : 'Sign in to Console'}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-secondary-100 text-center">
              <p className="text-xs text-secondary-600">
                Need to register a new company?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-navy-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                >
                  <span>Create an organization</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>

          {/* Quick Support Footnote */}
          <div className="mt-6 text-center text-xs text-secondary-500">
            Protected by ThreadPilot Enterprise Security • Multi-Tenant Isolated
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

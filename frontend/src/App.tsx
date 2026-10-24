import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ThreadPilotLogo } from './components/brand/ThreadPilotLogo';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Products = lazy(() => import('./pages/Products').then((m) => ({ default: m.Products })));
const Inventory = lazy(() => import('./pages/Inventory').then((m) => ({ default: m.Inventory })));
const Customers = lazy(() => import('./pages/Customers').then((m) => ({ default: m.Customers })));
const Orders = lazy(() => import('./pages/Orders').then((m) => ({ default: m.Orders })));
const Sales = lazy(() => import('./pages/Sales').then((m) => ({ default: m.Sales })));
const Payments = lazy(() => import('./pages/Payments').then((m) => ({ default: m.Payments })));
const Suppliers = lazy(() => import('./pages/Suppliers').then((m) => ({ default: m.Suppliers })));
const Invoices = lazy(() => import('./pages/Invoices').then((m) => ({ default: m.Invoices })));
const Expenses = lazy(() => import('./pages/Expenses').then((m) => ({ default: m.Expenses })));
const Alerts = lazy(() => import('./pages/Alerts').then((m) => ({ default: m.Alerts })));
const Copilot = lazy(() => import('./pages/Copilot').then((m) => ({ default: m.Copilot })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 selection:bg-blue-100">
    <div className="relative flex flex-col items-center animate-fade-in">
      <ThreadPilotLogo variant="symbol" size="lg" className="mb-4" />
      <div className="w-32 h-1 bg-secondary-200 rounded-full overflow-hidden">
        <div className="h-full bg-navy-900 rounded-full animate-pulse" />
      </div>
      <p className="text-[11px] font-semibold text-secondary-500 uppercase tracking-widest mt-3">
        Loading ThreadPilot AI
      </p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/copilot" element={<Copilot />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;

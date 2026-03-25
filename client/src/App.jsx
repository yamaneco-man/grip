import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// User
import Login from './pages/Login';
import UserLayout from './components/UserLayout';
import DashboardV2 from './pages/DashboardV2';
import LPList from './pages/LPList';
import LPGenerate from './pages/LPGenerate';
import Followers from './pages/Followers';
import FollowerDetail from './pages/FollowerDetail';
import ObjectionHandling from './pages/ObjectionHandling';
import ChurnScores from './pages/ChurnScores';
import StepConfig from './pages/StepConfig';
import Settings from './pages/Settings';

// Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContracts from './pages/admin/AdminContracts';
import AdminAgencies from './pages/admin/AdminAgencies';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminPlans from './pages/admin/AdminPlans';
import AdminSystem from './pages/admin/AdminSystem';
import AdminPermissions from './pages/admin/AdminPermissions';

// Partner
import PartnerLogin from './pages/partner/PartnerLogin';
import PartnerLayout from './components/PartnerLayout';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerCustomers from './pages/partner/PartnerCustomers';
import PartnerRevenue from './pages/partner/PartnerRevenue';
import PartnerReferral from './pages/partner/PartnerReferral';
import PartnerMaterials from './pages/partner/PartnerMaterials';
import PartnerSupport from './pages/partner/PartnerSupport';

function PrivateRoute({ children, tokenKey = 'grip_token', loginPath = '/login' }) {
  const token = localStorage.getItem(tokenKey);
  return token ? children : <Navigate to={loginPath} />;
}

export default function App() {
  return (
    <Routes>
      {/* ===== User ===== */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute><UserLayout /></PrivateRoute>
      }>
        <Route index element={<DashboardV2 />} />
        <Route path="lp" element={<LPList />} />
        <Route path="lp/generate" element={<LPGenerate />} />
        <Route path="followers" element={<Followers />} />
        <Route path="followers/:id" element={<FollowerDetail />} />
        <Route path="followers/:id/objection" element={<ObjectionHandling />} />
        <Route path="churn" element={<ChurnScores />} />
        <Route path="step-config" element={<StepConfig />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ===== Admin ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <PrivateRoute tokenKey="grip_admin_token" loginPath="/admin/login"><AdminLayout /></PrivateRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="contracts" element={<AdminContracts />} />
        <Route path="agencies" element={<AdminAgencies />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="permissions" element={<AdminPermissions />} />
      </Route>

      {/* ===== Partner ===== */}
      <Route path="/partner/login" element={<PartnerLogin />} />
      <Route path="/partner" element={
        <PrivateRoute tokenKey="grip_partner_token" loginPath="/partner/login"><PartnerLayout /></PrivateRoute>
      }>
        <Route index element={<PartnerDashboard />} />
        <Route path="customers" element={<PartnerCustomers />} />
        <Route path="revenue" element={<PartnerRevenue />} />
        <Route path="referral" element={<PartnerReferral />} />
        <Route path="materials" element={<PartnerMaterials />} />
        <Route path="support" element={<PartnerSupport />} />
      </Route>
    </Routes>
  );
}

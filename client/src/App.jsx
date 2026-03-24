import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LPList from './pages/LPList';
import LPGenerate from './pages/LPGenerate';
import Followers from './pages/Followers';
import ChurnScores from './pages/ChurnScores';
import Settings from './pages/Settings';
import FollowerDetail from './pages/FollowerDetail';
import ObjectionHandling from './pages/ObjectionHandling';
import StepConfig from './pages/StepConfig';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('grip_token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="lp" element={<LPList />} />
        <Route path="lp/generate" element={<LPGenerate />} />
        <Route path="followers" element={<Followers />} />
        <Route path="followers/:id" element={<FollowerDetail />} />
        <Route path="followers/:id/objection" element={<ObjectionHandling />} />
        <Route path="churn" element={<ChurnScores />} />
        <Route path="step-config" element={<StepConfig />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

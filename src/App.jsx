import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerificationCode from "./pages/VerificationCode";
import Dashboard from "./pages/Dashboard";
import EventsManager from "./pages/dashboards/EventsManager";
import CreateAdmin from "./components/CreateAdmin";
import AddUser from "./components/AddUser";
import DonorsList from "./components/DonorsList";
import AdminsList from "./components/AdminsList";
import UserProfile from "./components/UserProfile";
import SystemManagement from "./components/SystemManagement";
import Settings from "./pages/Settings";
import BloodRequest from "./pages/BloodRequest";
import "./App.css";

function PrivateRoutes() {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 dark:from-red-950 dark:via-pink-950 dark:to-red-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 dark:text-red-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events-manager"
          element={
            <ProtectedRoute requiredRole={["superadmin", "admin"]}>
              <EventsManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-admin"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <CreateAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-user"
          element={
            <ProtectedRoute requiredRole={["superadmin", "admin"]}>
              <AddUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donors"
          element={
            <ProtectedRoute>
              <DonorsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admins"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <AdminsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blood-request"
          element={
            <ProtectedRoute>
              <BloodRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-management"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <SystemManagement />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function RootRedirect() {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 dark:from-red-950 dark:via-pink-950 dark:to-red-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 dark:text-red-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 dark:from-red-950 dark:via-pink-950 dark:to-red-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 dark:text-red-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

import { useOfflineSync } from "./hooks/useOfflineSync";

function OfflineSyncHandler() {
  useOfflineSync();
  return null;
}

function App() {
  return (
    <AuthProvider>
      <OfflineSyncHandler />
      <BrowserRouter>
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
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/verification-code"
            element={
              <PublicRoute>
                <VerificationCode />
              </PublicRoute>
            }
          />
          <Route path="/*" element={<PrivateRoutes />} />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

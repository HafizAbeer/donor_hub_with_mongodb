import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminDashboard from "./dashboards/SuperAdminDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import UserDashboard from "./dashboards/UserDashboard";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 dark:text-red-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show SuperAdmin dashboard for superadmin role
  if (user.role === "superadmin") {
    return <SuperAdminDashboard />;
  }

  // Show Admin dashboard for admin role
  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  // Show User dashboard for user role or default
  return <UserDashboard />;
}

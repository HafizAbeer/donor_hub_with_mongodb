import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
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

  // Check if user is authenticated (must have both user and valid token)
  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User is authenticated and has required role (if any)
  return children;
}


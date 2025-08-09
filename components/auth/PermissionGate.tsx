"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserRole, subscribeToUserRole } from "@/lib/user-firestore";
import { UserRole, hasPermission, canAccessVenue, PermissionLevel } from "@/lib/user-roles";

interface PermissionGateProps {
  children: ReactNode;
  module?: keyof UserRole['modulePermissions'];
  permission?: PermissionLevel;
  venueId?: string;
  role?: UserRole['role'] | UserRole['role'][];
  fallback?: ReactNode;
  requireAny?: boolean; // If true, user needs ANY of the specified permissions instead of ALL
}

export function PermissionGate({
  children,
  module,
  permission = 'read',
  venueId,
  role,
  fallback = null,
  requireAny = false
}: PermissionGateProps) {
  const [user, loading, error] = useAuthState(auth);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setRoleLoading(false);
      return;
    }

    // Subscribe to user role changes
    const unsubscribe = subscribeToUserRole(user.uid, (role) => {
      setUserRole(role);
      setRoleLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Still loading authentication or role data
  if (loading || roleLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>;
  }

  // Not authenticated
  if (!user || !userRole) {
    return <>{fallback}</>;
  }

  // Check permissions
  const hasRequiredPermissions = checkPermissions({
    userRole,
    module,
    permission,
    venueId,
    role,
    requireAny
  });

  if (!hasRequiredPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface CheckPermissionsParams {
  userRole: UserRole;
  module?: keyof UserRole['modulePermissions'];
  permission?: PermissionLevel;
  venueId?: string;
  role?: UserRole['role'] | UserRole['role'][];
  requireAny?: boolean;
}

function checkPermissions({
  userRole,
  module,
  permission = 'read',
  venueId,
  role,
  requireAny = false
}: CheckPermissionsParams): boolean {
  const checks: boolean[] = [];

  // Check module permission
  if (module) {
    checks.push(hasPermission(userRole, module, permission));
  }

  // Check venue access
  if (venueId) {
    checks.push(canAccessVenue(userRole, venueId));
  }

  // Check role
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    checks.push(allowedRoles.includes(userRole.role));
  }

  // If no specific checks were provided, just check if user has an active role
  if (checks.length === 0) {
    return userRole.isActive;
  }

  // Apply logic based on requireAny flag
  return requireAny ? checks.some(check => check) : checks.every(check => check);
}

// Convenience components for common permission patterns
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role={['super_admin', 'admin']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role="super_admin" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function EventManagerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate module="events" permission="write" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function FinancialAccessOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate module="financials" permission="read" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function VenueAccessGate({ 
  children, 
  venueId, 
  fallback 
}: { 
  children: ReactNode; 
  venueId: string; 
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate venueId={venueId} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

// Hook for using permissions in custom components
export function usePermissions() {
  const [user] = useAuthState(auth);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserRole(user.uid, (role) => {
      setUserRole(role);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const checkPermission = (
    module: keyof UserRole['modulePermissions'],
    permission: PermissionLevel = 'read'
  ): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, module, permission);
  };

  const checkVenueAccess = (venueId: string): boolean => {
    if (!userRole) return false;
    return canAccessVenue(userRole, venueId);
  };

  const checkRole = (role: UserRole['role'] | UserRole['role'][]): boolean => {
    if (!userRole) return false;
    const allowedRoles = Array.isArray(role) ? role : [role];
    return allowedRoles.includes(userRole.role);
  };

  return {
    user,
    userRole,
    loading,
    checkPermission,
    checkVenueAccess,
    checkRole,
    isAdmin: userRole?.role === 'admin' || userRole?.role === 'super_admin',
    isSuperAdmin: userRole?.role === 'super_admin',
  };
}

// Component to show user's current permissions (useful for debugging)
export function PermissionDebugger() {
  const { userRole, loading } = usePermissions();

  if (loading) return <div>Loading permissions...</div>;
  if (!userRole) return <div>No permissions (not logged in)</div>;

  return (
    <div className="p-4 bg-gray-100 rounded-lg text-xs">
      <h4 className="font-semibold mb-2">Current Permissions:</h4>
      <div className="space-y-1">
        <div><strong>Role:</strong> {userRole.role}</div>
        <div><strong>Venue Access:</strong> {userRole.venueAccess.length} venues</div>
        <div><strong>Module Permissions:</strong></div>
        <ul className="ml-4">
          {Object.entries(userRole.modulePermissions).map(([module, permission]) => (
            <li key={module}>
              {module}: <span className="font-mono">{permission}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
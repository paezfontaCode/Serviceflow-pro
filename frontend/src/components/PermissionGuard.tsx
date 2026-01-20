import { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

interface PermissionGuardProps {
    children: ReactNode;
    allowedRoles?: string[];
    fallback?: ReactNode;
}

export default function PermissionGuard({ children, allowedRoles, fallback = null }: PermissionGuardProps) {
    const user = useAuthStore((state) => state.user);

    if (!user) return <>{fallback}</>;

    // Support both single role (legacy/frontend simplified) or array of objects (backend)
    const userRoles = Array.isArray(user.roles) 
        ? user.roles.map((r: any) => r.name)
        : [user.role];

    if (allowedRoles && !allowedRoles.some(role => userRoles.includes(role))) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

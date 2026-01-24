'use client';

import { useAuthStore } from '@/store';

/**
 * Hook to check if the current user has a specific permission
 * @returns {Object} { hasPermission: (resource, action) => boolean, permissions: Object, role: string }
 */
export const usePermission = () => {
    const { user } = useAuthStore();

    const permissions = user?.permissions || {};
    const role = user?.role || 'viewer';

    /**
     * Check if user has permission for a specific resource and action
     * @param {string} resource - The resource name (e.g., 'brds', 'user_stories')
     * @param {string} action - The action name (e.g., 'create', 'update', 'delete', 'comment')
     * @returns {boolean}
     */
    const hasPermission = (resource, action) => {
        // Admin has all permissions except if explicitly restricted (rare)
        if (role === 'admin') return true;

        const resourcePermissions = permissions[resource];
        if (!resourcePermissions) return false;

        return resourcePermissions.includes(action);
    };

    return {
        hasPermission,
        permissions,
        role,
        user
    };
};

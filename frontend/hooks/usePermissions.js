import { useState, useEffect } from 'react';
import api from '../lib/api';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({});
  const [accessibleResources, setAccessibleResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/permissions/my-permissions');
        setPermissions(response.data.data.permissions);

        const resourcesResponse = await api.get('/permissions/accessible');
        setAccessibleResources(resourcesResponse.data.data.resources);

        setError(null);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (resource, action) => {
    if (!permissions[resource]) {
      return false;
    }
    return permissions[resource].includes(action);
  };

  const canAccessResource = (resource) => {
    return accessibleResources.includes(resource);
  };

  const checkPermission = (resource, action) => {
    return hasPermission(resource, action);
  };

  return {
    permissions,
    accessibleResources,
    loading,
    error,
    hasPermission,
    canAccessResource,
    checkPermission
  };
};

// Hook to conditionally render content based on permissions
export const PermissionGate = ({ resource, action, children, fallback = null }) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return fallback;
  }

  if (!hasPermission(resource, action)) {
    return fallback;
  }

  return children;
};

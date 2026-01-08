import { useState, useEffect, useRef } from 'react';
import client from '../api/client';

// Custom hook for tracking views
export const useViewTracking = () => {
  const [sessionId, setSessionId] = useState(null);
  const recordedViews = useRef(new Set());

  useEffect(() => {
    // Generate or retrieve session ID
    let storedSessionId = localStorage.getItem('viewSessionId');
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('viewSessionId', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const recordView = async (entityType, entityId, options = {}) => {
    if (!sessionId) return null;

    // Create a unique key for this view
    const viewKey = `${entityType}-${entityId}`;
    
    // Avoid recording the same view multiple times in the same session (unless forced)
    if (!options.force && recordedViews.current.has(viewKey)) {
      return { duplicate: true };
    }

    try {
      const response = await client.post('/api/views/record', {
        entityType,
        entityId: parseInt(entityId)
      }, {
        headers: {
          'X-Session-ID': sessionId
        }
      });

      if (response.data.success && !response.data.duplicate) {
        recordedViews.current.add(viewKey);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to record view:', error);
      return { error: error.message };
    }
  };

  const getViewCount = async (entityType, entityId) => {
    try {
      const response = await client.get(`/api/views/count/${entityType}/${entityId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get view count:', error);
      return { error: error.message };
    }
  };

  const getViewStats = async (entityType, entityId, period = '30d') => {
    try {
      const response = await client.get(`/api/views/stats/${entityType}/${entityId}?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get view stats:', error);
      return { error: error.message };
    }
  };

  const getTrendingEntities = async (entityType = null, limit = 10, period = '7d') => {
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entityType', entityType);
      params.append('limit', limit.toString());
      params.append('period', period);

      const response = await client.get(`/api/views/trending?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get trending entities:', error);
      return { error: error.message };
    }
  };

  return {
    recordView,
    getViewCount,
    getViewStats,
    getTrendingEntities,
    sessionId
  };
};

// Hook for automatically tracking page views
export const useAutoViewTracking = (entityType, entityId, options = {}) => {
  const { recordView } = useViewTracking();
  const [viewRecorded, setViewRecorded] = useState(false);
  const hasRecorded = useRef(false);

  useEffect(() => {
    const trackView = async () => {
      if (!entityType || !entityId || hasRecorded.current) return;

      // Add a small delay to ensure the user actually viewed the content
      const delay = options.delay || 2000; // 2 seconds default
      const timer = setTimeout(async () => {
        const result = await recordView(entityType, entityId, options);
        if (result && !result.error) {
          setViewRecorded(true);
          hasRecorded.current = true;
        }
      }, delay);

      return () => clearTimeout(timer);
    };

    trackView();
  }, [entityType, entityId, recordView, options]);

  return { viewRecorded };
};

// Hook for getting and displaying view count
export const useViewCount = (entityType, entityId) => {
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { getViewCount } = useViewTracking();

  useEffect(() => {
    const fetchViewCount = async () => {
      if (!entityType || !entityId) return;

      setLoading(true);
      try {
        const result = await getViewCount(entityType, entityId);
        if (result && !result.error) {
          setViewCount(result.viewCount || 0);
        }
      } catch (error) {
        console.error('Error fetching view count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchViewCount();
  }, [entityType, entityId, getViewCount]);

  const refreshViewCount = async () => {
    if (!entityType || !entityId) return;
    
    try {
      const result = await getViewCount(entityType, entityId);
      if (result && !result.error) {
        setViewCount(result.viewCount || 0);
      }
    } catch (error) {
      console.error('Error refreshing view count:', error);
    }
  };

  return { viewCount, loading, refreshViewCount };
};
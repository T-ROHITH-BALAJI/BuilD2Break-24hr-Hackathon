import React from 'react';
import { Eye, TrendingUp, Users, Clock } from 'lucide-react';
import { useViewCount, useAutoViewTracking } from '../hooks/useViewTracking';

// Simple view counter component
const ViewCounter = ({ 
  entityType, 
  entityId, 
  showIcon = true, 
  className = '', 
  autoTrack = false,
  trackingOptions = {}
}) => {
  const { viewCount, loading } = useViewCount(entityType, entityId);
  
  // Auto-track view if enabled
  useAutoViewTracking(
    autoTrack ? entityType : null, 
    autoTrack ? entityId : null, 
    trackingOptions
  );

  if (loading) {
    return (
      <div className={`flex items-center text-gray-500 ${className}`}>
        {showIcon && <Eye className="w-4 h-4 mr-1" />}
        <span className="text-sm">...</span>
      </div>
    );
  }

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={`flex items-center text-gray-600 hover:text-blue-600 transition-colors ${className}`}>
      {showIcon && <Eye className="w-4 h-4 mr-1" />}
      <span className="text-sm font-medium">
        {formatViewCount(viewCount)} {viewCount === 1 ? 'view' : 'views'}
      </span>
    </div>
  );
};

// Enhanced view counter with additional stats
const EnhancedViewCounter = ({ 
  entityType, 
  entityId, 
  showTrending = false,
  className = '' 
}) => {
  const { viewCount, loading } = useViewCount(entityType, entityId);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center text-gray-600">
        <Eye className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">{viewCount.toLocaleString()}</span>
      </div>
      
      {showTrending && viewCount > 100 && (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">Trending</span>
        </div>
      )}
    </div>
  );
};

// View statistics card component
const ViewStatsCard = ({ entityType, entityId, period = '7d' }) => {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/views/stats/${entityType}/${entityId}?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch view stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (entityType && entityId) {
      fetchStats();
    }
  }, [entityType, entityId, period]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-sm border border-blue-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Eye className="w-5 h-5 mr-2 text-blue-600" />
        View Analytics ({period})
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <Eye className="w-3 h-3 mr-1" />
            Total Views
          </div>
        </div>
        
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.uniqueUsers}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <Users className="w-3 h-3 mr-1" />
            Unique Users
          </div>
        </div>
        
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{stats.uniqueSessions}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <Users className="w-3 h-3 mr-1" />
            Sessions
          </div>
        </div>
        
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{stats.activeDays}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <Clock className="w-3 h-3 mr-1" />
            Active Days
          </div>
        </div>
      </div>
      
      {stats.lastView && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Last viewed: {new Date(stats.lastView).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ViewCounter;
export { EnhancedViewCounter, ViewStatsCard };
import React, { useState, useEffect } from 'react';
import {
  Eye,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useViewTracking } from '../hooks/useViewTracking';

const AnalyticsDashboard = ({ entityType = null, entityId = null, showOverallStats = true }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('totalViews');
  const { getTrendingEntities } = useViewTracking();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = `/api/views/dashboard?period=${period}`;
      const token = localStorage.getItem('token');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.dashboard);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const periodOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Track views, engagement, and performance metrics</p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchDashboardData}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {dashboardData?.overallStats && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overview ({period})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Views</p>
                  <p className="text-2xl font-bold text-blue-800 mt-1">
                    {formatNumber(dashboardData.overallStats.total_views)}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Unique Users</p>
                  <p className="text-2xl font-bold text-green-800 mt-1">
                    {formatNumber(dashboardData.overallStats.unique_users)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Sessions</p>
                  <p className="text-2xl font-bold text-purple-800 mt-1">
                    {formatNumber(dashboardData.overallStats.unique_sessions)}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Active Days</p>
                  <p className="text-2xl font-bold text-orange-800 mt-1">
                    {formatNumber(dashboardData.overallStats.active_days)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Daily Trends</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="total_views">Total Views</option>
              <option value="unique_users">Unique Users</option>
              <option value="unique_sessions">Sessions</option>
            </select>
          </div>
          
          {dashboardData?.dailyTrends && dashboardData.dailyTrends.length > 0 ? (
            <div className="space-y-2">
              {dashboardData.dailyTrends.slice(0, 10).map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {formatNumber(day[selectedMetric] || day.total_views)}
                    </span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (day[selectedMetric] || day.total_views) / Math.max(...dashboardData.dailyTrends.map(d => d[selectedMetric] || d.total_views)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Entity Type Breakdown */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Content Type Breakdown</h3>
          
          {dashboardData?.entityTypeBreakdown && dashboardData.entityTypeBreakdown.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.entityTypeBreakdown.map((entity, index) => {
                const total = dashboardData.entityTypeBreakdown.reduce((sum, e) => sum + parseInt(e.view_count), 0);
                const percentage = total > 0 ? (parseInt(entity.view_count) / total * 100).toFixed(1) : 0;
                
                return (
                  <div key={entity.viewed_entity_type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-gray-700">
                        {entity.viewed_entity_type}s
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(entity.view_count)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' :
                          index === 2 ? 'bg-purple-600' : 'bg-orange-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <PieChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trending Section */}
      <TrendingSection period={period} />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <RefreshCw className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Refresh Data</h4>
            <p className="text-sm text-gray-600">Update all statistics</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Download className="w-5 h-5 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Export Report</h4>
            <p className="text-sm text-gray-600">Download analytics data</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Filter className="w-5 h-5 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Custom Filters</h4>
            <p className="text-sm text-gray-600">Advanced filtering options</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Trending entities component
const TrendingSection = ({ period }) => {
  const [trendingData, setTrendingData] = useState({
    jobs: [],
    profiles: [],
    loading: true
  });

  const { getTrendingEntities } = useViewTracking();

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const [jobsData, profilesData] = await Promise.all([
          getTrendingEntities('job', 5, period),
          getTrendingEntities('profile', 5, period)
        ]);

        setTrendingData({
          jobs: jobsData.trending || [],
          profiles: profilesData.trending || [],
          loading: false
        });
      } catch (error) {
        console.error('Error fetching trending data:', error);
        setTrendingData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTrendingData();
  }, [period, getTrendingEntities]);

  if (trendingData.loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Trending Content ({period})
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Jobs */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">🔥 Trending Jobs</h4>
          {trendingData.jobs.length > 0 ? (
            <div className="space-y-2">
              {trendingData.jobs.map((job, index) => (
                <div key={job.entityId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-gray-500 w-4">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.details?.title || `Job #${job.entityId}`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {job.details?.company || 'Unknown Company'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      {job.viewCount} views
                    </p>
                    <p className="text-xs text-gray-500">
                      {job.uniqueUsers} users
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No trending jobs data available
            </div>
          )}
        </div>

        {/* Trending Profiles */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">👥 Trending Profiles</h4>
          {trendingData.profiles.length > 0 ? (
            <div className="space-y-2">
              {trendingData.profiles.map((profile, index) => (
                <div key={profile.entityId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-gray-500 w-4">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Profile #{profile.entityId}
                      </p>
                      <p className="text-xs text-gray-600">
                        Job Seeker
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {profile.viewCount} views
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.uniqueUsers} users
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No trending profiles data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCcw,
  Settings,
  Download,
  Filter,
  Calendar,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Building
} from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [timeRange, setTimeRange] = useState('30d');

  // Helper function to process stats data from backend
  const processStatsData = (backendStats) => {
    // Process users data
    const usersData = backendStats.users || [];
    const totalUsers = usersData.reduce((sum, user) => sum + parseInt(user.count), 0);
    const recruiters = usersData.find(u => u.role === 'recruiter')?.count || 0;
    const jobSeekers = usersData.find(u => u.role === 'job_seeker')?.count || 0;
    
    return {
      totalUsers,
      activeRecruiters: parseInt(recruiters),
      jobSeekers: parseInt(jobSeekers),
      totalJobs: backendStats.totalJobs || 0,
      totalApplications: backendStats.totalApplications || 0,
      totalInterviews: backendStats.totalInterviews || 0,
      successfulHires: Math.floor(backendStats.totalApplications * 0.15) || 0, // Estimate
      systemUptime: 99.8,
      monthlyRevenue: Math.floor(backendStats.totalJobs * 150) || 0, // Estimate
      growthRate: 12.5 // Can be calculated from historical data
    };
  };
  
  // Helper function to generate recent activities from real data
  const generateRecentActivities = (backendStats) => {
    const activities = [];
    
    if (backendStats.totalUsers > 0) {
      activities.push({
        id: 1,
        type: 'users_overview',
        description: `Platform has ${backendStats.totalUsers} total users`,
        timestamp: new Date().toISOString(),
        icon: UserCheck,
        color: 'text-green-600'
      });
    }
    
    if (backendStats.totalJobs > 0) {
      activities.push({
        id: 2,
        type: 'jobs_overview',
        description: `${backendStats.totalJobs} jobs currently available`,
        timestamp: new Date().toISOString(),
        icon: Briefcase,
        color: 'text-blue-600'
      });
    }
    
    if (backendStats.totalApplications > 0) {
      activities.push({
        id: 3,
        type: 'applications_overview',
        description: `${backendStats.totalApplications} total applications received`,
        timestamp: new Date().toISOString(),
        icon: FileText,
        color: 'text-purple-600'
      });
    }
    
    // Add more activities based on real data
    const recruiters = backendStats.users?.find(u => u.role === 'recruiter')?.count || 0;
    if (recruiters > 0) {
      activities.push({
        id: 4,
        type: 'recruiters_overview',
        description: `${recruiters} recruiters actively hiring`,
        timestamp: new Date().toISOString(),
        icon: Shield,
        color: 'text-orange-600'
      });
    }
    
    return activities.length > 0 ? activities : mockActivities;
  };

  // Mock data (fallback)
  const mockStats = {
    totalUsers: 15847,
    activeRecruiters: 245,
    totalJobs: 1256,
    totalApplications: 8934,
    successfulHires: 342,
    systemUptime: 99.8,
    monthlyRevenue: 125000,
    growthRate: 12.5
  };

  const mockSystemHealth = {
    apiStatus: 'healthy',
    databaseStatus: 'healthy',
    emailService: 'warning',
    storageUsage: 78,
    activeConnections: 1245,
    responseTime: 145
  };

  const mockActivities = [
    {
      id: 1,
      type: 'user_registered',
      description: 'New job seeker Sarah Johnson registered',
      timestamp: '2024-01-26T10:30:00Z',
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'job_posted',
      description: 'New job "Senior Developer" posted by TechCorp',
      timestamp: '2024-01-26T09:45:00Z',
      icon: Briefcase,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'application_submitted',
      description: '5 new applications received in the last hour',
      timestamp: '2024-01-26T09:15:00Z',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'recruiter_approved',
      description: 'Recruiter account for InnovateCorp approved',
      timestamp: '2024-01-26T08:20:00Z',
      icon: Shield,
      color: 'text-orange-600'
    },
    {
      id: 5,
      type: 'system_alert',
      description: 'Email service experiencing minor delays',
      timestamp: '2024-01-26T07:30:00Z',
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ];

  const mockChartData = {
    userRegistrations: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [450, 520, 480, 630, 590, 720]
    },
    jobPostings: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [85, 92, 78, 105, 98, 125]
    },
    applications: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [1200, 1350, 1180, 1580, 1420, 1650]
    }
  };

  useEffect(() => {
    // Fetch real data from backend
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        // Fetch real dashboard statistics
        const response = await fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response Error:', response.status, errorText);
          throw new Error(`API Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Dashboard API Response:', data);
        
        if (data.success) {
          // Process the real data
          console.log('Processing stats data:', data.stats);
          const processedStats = processStatsData(data.stats);
          console.log('Processed stats:', processedStats);
          setStats(processedStats);
          
          // Set mock data for system health (you can implement real health check later)
          setSystemHealth(mockSystemHealth);
          
          // Generate recent activities from real data
          const recentActivitiesData = generateRecentActivities(data.stats);
          setRecentActivities(recentActivitiesData);
          
          // Set chart data (can be enhanced with real time-series data later)
          setChartData(mockChartData);
          
          toast.success('Dashboard data loaded successfully!');
        } else {
          console.error('Backend returned error:', data.error, data.details);
          throw new Error(data.error || 'Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to fetch dashboard data: ' + error.message);
        
        // Fallback to mock data in case of error
        setStats(mockStats);
        setSystemHealth(mockSystemHealth);
        setRecentActivities(mockActivities);
        setChartData(mockChartData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl">
        <div className="text-center">
          <RefreshCcw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-purple-600 font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/30 animate-slideInDown">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Admin Dashboard 🔐</h1>
          <p className="text-gray-600 mt-1">System overview and platform analytics</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="group px-4 py-2 bg-gray-100/80 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm">
            <Download className="w-4 h-4 inline mr-2 group-hover:animate-bounce" />
            Export
          </button>
          <button className="group px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
            <Settings className="w-4 h-4 inline mr-2 group-hover:rotate-180 transition-transform duration-300" />
            Settings
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stats.totalUsers?.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1 animate-bounce" />
                <span className="text-sm text-green-600 font-semibold">+{stats.growthRate}%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulseGlow" style={{width: '85%'}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Recruiters</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.activeRecruiters}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1 animate-bounce" />
                <span className="text-sm text-green-600 font-semibold">+8.2%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Building className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full animate-pulseGlow" style={{width: '78%'}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalJobs?.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1 animate-bounce" />
                <span className="text-sm text-green-600 font-semibold">+15.3%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full animate-pulseGlow" style={{width: '92%'}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">${stats.monthlyRevenue?.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1 animate-bounce" />
                <span className="text-sm text-green-600 font-semibold">+22.1%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full animate-pulseGlow" style={{width: '96%'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6 animate-slideInLeft">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">System Health 🔧</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">API Status</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(systemHealth.apiStatus)}`}>
                {getStatusIcon(systemHealth.apiStatus)}
                <span className="ml-2 capitalize">{systemHealth.apiStatus}</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Database</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(systemHealth.databaseStatus)}`}>
                {getStatusIcon(systemHealth.databaseStatus)}
                <span className="ml-2 capitalize">{systemHealth.databaseStatus}</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Email Service</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(systemHealth.emailService)}`}>
                {getStatusIcon(systemHealth.emailService)}
                <span className="ml-2 capitalize">{systemHealth.emailService}</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Storage Usage</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full animate-pulseGlow" 
                    style={{ width: `${systemHealth.storageUsage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-700">{systemHealth.storageUsage}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Active Connections</span>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{systemHealth.activeConnections?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Avg Response Time</span>
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">{systemHealth.responseTime}ms</span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6 animate-slideInRight">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">Key Performance Indicators 📊</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <span className="text-sm font-semibold text-gray-700">System Uptime</span>
              <span className="text-2xl font-bold text-green-600">{stats.systemUptime}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <span className="text-sm font-semibold text-gray-700">Total Applications</span>
              <span className="text-2xl font-bold text-blue-600">{stats.totalApplications?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <span className="text-sm font-semibold text-gray-700">Successful Hires</span>
              <span className="text-2xl font-bold text-purple-600">{stats.successfulHires}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
              <span className="text-sm font-semibold text-gray-700">Conversion Rate</span>
              <span className="text-2xl font-bold text-orange-600">
                {((stats.successfulHires / stats.totalApplications) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6 animate-slideInUp" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recent Activities 🔄</h3>
            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors duration-300 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="group flex items-start space-x-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideInRight" style={{animationDelay: `${0.6 + index * 0.1}s`}}>
                  <div className={`p-2 rounded-xl ${activity.color.replace('text-', 'bg-').replace('-600', '-100')} shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../../api/client';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Video,
  MapPin,
  User,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bell,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const Schedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Backend data
  const mockInterviews = [
    {
      id: 1,
      candidateName: 'Sarah Johnson',
      candidateEmail: 'sarah.johnson@email.com',
      jobTitle: 'Senior Frontend Developer',
      date: '2025-07-26',
      time: '10:00 AM',
      duration: 60,
      type: 'video',
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      location: '',
      interviewer: 'John Smith',
      notes: 'Technical interview focusing on React and system design',
      reminder: true,
      candidateAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
    },
    {
      id: 2,
      candidateName: 'Michael Chen',
      candidateEmail: 'michael.chen@email.com',
      jobTitle: 'DevOps Engineer',
      date: '2025-07-26',
      time: '2:00 PM',
      duration: 45,
      type: 'in-person',
      status: 'confirmed',
      meetingLink: '',
      location: 'Conference Room A, 10th Floor',
      interviewer: 'Jane Doe',
      notes: 'Cultural fit and leadership discussion',
      reminder: true,
      candidateAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    {
      id: 3,
      candidateName: 'Emily Rodriguez',
      candidateEmail: 'emily.rodriguez@email.com',
      jobTitle: 'UX Designer',
      date: '2025-07-27',
      time: '11:30 AM',
      duration: 90,
      type: 'video',
      status: 'pending',
      meetingLink: 'https://zoom.us/j/123456789',
      location: '',
      interviewer: 'Alex Johnson',
      notes: 'Portfolio review and design challenge',
      reminder: false,
      candidateAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    },
    {
      id: 4,
      candidateName: 'David Kim',
      candidateEmail: 'david.kim@email.com',
      jobTitle: 'Data Scientist',
      date: '2025-07-28',
      time: '3:30 PM',
      duration: 60,
      type: 'phone',
      status: 'completed',
      meetingLink: '',
      location: '',
      interviewer: 'Lisa Wilson',
      notes: 'Initial screening call completed successfully',
      reminder: true,
      candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 5,
      candidateName: 'Jessica Taylor',
      candidateEmail: 'jessica.taylor@email.com',
      jobTitle: 'Product Manager',
      date: '2025-07-29',
      time: '9:00 AM',
      duration: 75,
      type: 'video',
      status: 'cancelled',
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/',
      location: '',
      interviewer: 'Mark Davis',
      notes: 'Cancelled due to candidate unavailability',
      reminder: false,
      candidateAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150'
    },
    {
      id: 6,
      candidateName: 'Robert Brown',
      candidateEmail: 'robert.brown@email.com',
      jobTitle: 'Backend Developer',
      date: '2025-07-30',
      time: '2:00 PM',
      duration: 60,
      type: 'video',
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/xyz-abc-def',
      location: '',
      interviewer: 'Sarah Wilson',
      notes: 'System design and architecture discussion',
      reminder: true,
      candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    {
      id: 7,
      candidateName: 'Anna Davis',
      candidateEmail: 'anna.davis@email.com',
      jobTitle: 'Marketing Specialist',
      date: '2025-07-31',
      time: '10:30 AM',
      duration: 45,
      type: 'in-person',
      status: 'confirmed',
      meetingLink: '',
      location: 'Conference Room B, 5th Floor',
      interviewer: 'Tom Anderson',
      notes: 'Creative portfolio review and campaign strategies',
      reminder: true,
      candidateAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    },
    {
      id: 8,
      candidateName: 'James Wilson',
      candidateEmail: 'james.wilson@email.com',
      jobTitle: 'Full Stack Developer',
      date: '2025-08-01',
      time: '3:00 PM',
      duration: 90,
      type: 'video',
      status: 'pending',
      meetingLink: 'https://zoom.us/j/987654321',
      location: '',
      interviewer: 'Emily Johnson',
      notes: 'Technical assessment and coding challenge',
      reminder: false,
      candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    }
  ];

  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const res = await client.get('/api/recruiter/interviews');
        if (res.data?.success) {
          const mapped = res.data.interviews.map(i => ({
            id: i.interview_id,
            candidateName: i.seeker_name,
            candidateEmail: i.seeker_email,
            jobTitle: i.job_title,
            date: i.schedule ? String(i.schedule).substring(0,10) : '',
            time: i.schedule ? new Date(i.schedule).toLocaleTimeString() : '',
            duration: i.duration || 60,
            type: i.type || 'video',
            status: i.status || 'scheduled',
            meetingLink: i.meeting_link || '',
            location: i.location || '',
            interviewer: 'Recruiter',
            notes: i.notes || '',
            reminder: false,
            candidateAvatar: '/api/placeholder/40/40'
          }));
          setInterviews(mapped);
          setFilteredInterviews(mapped);
        }
      } catch (error) {
        toast.error('Failed to fetch interviews');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  useEffect(() => {
    let filtered = interviews;

    if (searchTerm) {
      filtered = filtered.filter(interview =>
        interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(interview => interview.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(interview => interview.type === typeFilter);
    }

    setFilteredInterviews(filtered);
  }, [searchTerm, statusFilter, typeFilter, interviews]);

  const handleStatusChange = async (interviewId, newStatus) => {
    try {
      await client.put(`/api/recruiter/interviews/${interviewId}`, { status: newStatus });
      setInterviews(prevInterviews =>
        prevInterviews.map(interview =>
          interview.id === interviewId ? { ...interview, status: newStatus } : interview
        )
      );
      toast.success(`Interview ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update interview');
    }
  };

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInterviewId, setEditInterviewId] = useState(null);
const [editForm, setEditForm] = useState({
    scheduleDateTime: '',
    type: 'video',
    meetingLink: '',
    location: '',
    duration: 60,
    notes: '',
    outcome: ''
  });

  const handleReschedule = async (interviewId) => {
    // Open edit modal (full editor)
    setEditInterviewId(interviewId);
    setEditForm({ scheduleDateTime: '', type: 'video', meetingLink: '', location: '', duration: 60, notes: '' });
    setShowEditModal(true);
  };

const saveEditInterview = async () => {
    try {
      const payload = {
        status: undefined,
        schedule_time: editForm.scheduleDateTime ? new Date(editForm.scheduleDateTime).toISOString() : undefined,
        type: editForm.type,
        meeting_link: editForm.meetingLink,
        location: editForm.location,
        notes: editForm.notes,
        duration: editForm.duration,
        outcome: editForm.outcome || undefined
      };
      // prune undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      await client.put(`/api/recruiter/interviews/${editInterviewId}`, payload);
      // Update local state best-effort
      setInterviews(prev => prev.map(i => i.id === editInterviewId ? {
        ...i,
        date: editForm.scheduleDateTime ? editForm.scheduleDateTime.substring(0,10) : i.date,
        time: editForm.scheduleDateTime ? new Date(editForm.scheduleDateTime).toLocaleTimeString() : i.time,
        type: editForm.type || i.type,
        meetingLink: editForm.meetingLink || i.meetingLink,
        location: editForm.location || i.location,
        duration: editForm.duration || i.duration,
        notes: editForm.notes || i.notes
      } : i));
      setShowEditModal(false);
      toast.success('Interview updated');
    } catch (e) {
      toast.error('Failed to update interview');
    }
  };

  const handleDelete = async (interviewId) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      await client.delete(`/api/recruiter/interviews/${interviewId}`);
      setInterviews(prevInterviews => 
        prevInterviews.filter(interview => interview.id !== interviewId)
      );
      toast.success('Interview deleted');
    } catch (e) {
      toast.error('Failed to delete interview');
    }
  };

  const handleCancel = async (interviewId) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) return;
    try {
      await client.put(`/api/recruiter/interviews/${interviewId}`, { status: 'cancelled' });
      setInterviews(prevInterviews =>
        prevInterviews.map(interview =>
          interview.id === interviewId ? { ...interview, status: 'cancelled' } : interview
        )
      );
      toast.success('Interview cancelled');
    } catch (e) {
      toast.error('Failed to cancel interview');
    }
  };

  const handleSendReminder = (interviewId) => {
    toast.success('Reminder sent to candidate');
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || colors.scheduled;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'rescheduled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'in-person':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  // Helper function to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getTodaysInterviews = () => {
    const today = getLocalDateStr(new Date());
    return filteredInterviews.filter(interview => interview.date === today);
  };

  const getUpcomingInterviews = () => {
    const today = getLocalDateStr(new Date());
    return filteredInterviews.filter(interview => interview.date > today);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const todayStr = getLocalDateStr(new Date());
    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = getLocalDateStr(currentDay);
      const dayInterviews = filteredInterviews.filter(interview => interview.date === dateStr);
      
      days.push({
        date: new Date(currentDay),
        dateStr,
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: dateStr === todayStr,
        interviews: dayInterviews
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RotateCcw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl text-white transform hover:scale-[1.02] transition-all duration-300">
        <div className="animate-slide-in-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
            Interview Schedule
          </h1>
          <p className="text-purple-100 mt-2">Manage and track all your interviews with style</p>
        </div>
        <div className="flex space-x-3 animate-slide-in-right">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 font-medium transition-all duration-300 hover:scale-105 border border-white/20"
          >
            {viewMode === 'calendar' ? '📋 List View' : '📅 Calendar View'}
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            ✨ Schedule Interview
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 hover:rotate-1 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 font-medium mb-2">Today's Interviews</p>
              <p className="text-3xl font-bold text-white group-hover:text-blue-100 transition-colors">
                {getTodaysInterviews().length}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-blue-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
          </div>
          <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full w-3/4 animate-pulse"></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 hover:-rotate-1 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 font-medium mb-2">Upcoming</p>
              <p className="text-3xl font-bold text-white group-hover:text-emerald-100 transition-colors">
                {getUpcomingInterviews().length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-emerald-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
          </div>
          <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full w-2/3 animate-pulse delay-100"></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 hover:rotate-1 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 font-medium mb-2">Confirmed</p>
              <p className="text-3xl font-bold text-white group-hover:text-purple-100 transition-colors">
                {interviews.filter(i => i.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-purple-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
          </div>
          <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full w-5/6 animate-pulse delay-200"></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 hover:-rotate-1 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 font-medium mb-2">Pending</p>
              <p className="text-3xl font-bold text-white group-hover:text-amber-100 transition-colors">
                {interviews.filter(i => i.status === 'pending').length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-amber-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
          </div>
          <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full w-1/2 animate-pulse delay-300"></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 p-6 backdrop-blur-sm animate-slide-up">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-purple-500 transition-colors duration-300" />
              <input
                type="text"
                placeholder="🔍 Search candidates, jobs, or interviewers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-purple-300"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-blue-300 cursor-pointer"
            >
              <option value="all">🎯 All Status</option>
              <option value="scheduled">📅 Scheduled</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="pending">⏳ Pending</option>
              <option value="completed">🎉 Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emerald-300 cursor-pointer"
            >
              <option value="all">🌟 All Types</option>
              <option value="video">📹 Video Call</option>
              <option value="phone">📞 Phone Call</option>
              <option value="in-person">🏢 In-Person</option>
            </select>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Interview</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-800">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input type="datetime-local" className="w-full border rounded px-3 py-2" value={editForm.scheduleDateTime} onChange={e => setEditForm(f => ({...f, scheduleDateTime: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full border rounded px-3 py-2" value={editForm.type} onChange={e => setEditForm(f => ({...f, type: e.target.value}))}>
                  <option value="video">Video</option>
                  <option value="phone">Phone</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                <input className="w-full border rounded px-3 py-2" placeholder="https://..." value={editForm.meetingLink} onChange={e => setEditForm(f => ({...f, meetingLink: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input className="w-full border rounded px-3 py-2" placeholder="Office / Room / Address" value={editForm.location} onChange={e => setEditForm(f => ({...f, location: e.target.value}))} />
              </div>
<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={editForm.duration} onChange={e => setEditForm(f => ({...f, duration: Number(e.target.value || 0)}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome (updates application)</label>
                <select className="w-full border rounded px-3 py-2" value={editForm.outcome} onChange={e => setEditForm(f => ({...f, outcome: e.target.value}))}>
                  <option value="">No change</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={saveEditInterview} className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-2xl border border-gray-100 p-8 backdrop-blur-sm animate-slide-up">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              📅 {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-3 hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 hover:text-white rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                ✨ Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-3 hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 hover:text-white rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center text-sm font-bold text-gray-700 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`min-h-32 p-3 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  day.isCurrentMonth 
                    ? 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-purple-300' 
                    : 'bg-gray-100 border-gray-100 hover:border-gray-300'
                } ${day.isToday ? 'ring-4 ring-purple-500/30 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300' : ''}`}
                onClick={() => setSelectedDate(day.dateStr)}
              >
                <div className={`text-sm font-bold mb-2 ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${day.isToday ? 'text-purple-600' : ''}`}>
                  {day.date.getDate()}
                  {day.isToday && ' 🌟'}
                </div>
                <div className="space-y-1">
                  {day.interviews.slice(0, 2).map((interview, idx) => (
                    <div
                      key={interview.id}
                      className={`text-xs p-2 rounded-lg truncate transition-all duration-300 hover:scale-105 cursor-pointer ${
                        interview.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                        interview.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                        interview.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                        'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      }`}
                      title={`${interview.time} - ${interview.candidateName}`}
                      style={{
                        animationDelay: `${idx * 100}ms`,
                        animation: 'slideInUp 0.3s ease-out forwards'
                      }}
                    >
                      🕐 {interview.time} {interview.candidateName}
                    </div>
                  ))}
                  {day.interviews.length > 2 && (
                    <div className="text-xs text-purple-600 font-semibold bg-purple-100 rounded-lg p-1 text-center">
                      +{day.interviews.length - 2} more 🎯
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg shadow border">
          <div className="divide-y divide-gray-200">
            {filteredInterviews.map((interview) => (
              <div key={interview.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <img
                    src={interview.candidateAvatar}
                    alt={interview.candidateName}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{interview.candidateName}</h3>
                        <p className="text-sm font-medium text-blue-600">{interview.jobTitle}</p>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(interview.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {interview.time} ({interview.duration} min)
                          </span>
                          <span className="flex items-center">
                            {getTypeIcon(interview.type)}
                            <span className="ml-1 capitalize">{interview.type.replace('-', ' ')}</span>
                          </span>
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {interview.interviewer}
                          </span>
                        </div>
                        {interview.notes && (
                          <p className="mt-2 text-sm text-gray-600">{interview.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {getStatusIcon(interview.status)}
                          <span className="ml-1 capitalize">{interview.status}</span>
                        </span>

                        <div className="flex space-x-2">
                          {interview.meetingLink && (
                            <button
                              onClick={() => window.open(interview.meetingLink, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Join Meeting"
                            >
                              <Video className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSendReminder(interview.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Send Reminder"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReschedule(interview.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Reschedule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {interview.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(interview.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="Cancel Interview"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(interview.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <select
                          value={interview.status}
                          onChange={(e) => handleStatusChange(interview.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="rescheduled">Rescheduled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredInterviews.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Schedule your first interview to get started'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 animate-fade-in">
          <div className="relative top-10 mx-auto p-8 border-0 w-full max-w-3xl">
            <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl border border-gray-100 animate-scale-in">
              <div className="flex items-center justify-between p-8 border-b border-gray-100">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ✨ Schedule New Interview
                </h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110 hover:rotate-90 p-2 rounded-full hover:bg-red-50"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newInterview = {
                  id: Date.now(),
                  candidateName: formData.get('candidateName'),
                  candidateEmail: formData.get('candidateEmail'),
                  jobTitle: formData.get('jobTitle'),
                  date: formData.get('date'),
                  time: formData.get('time'),
                  duration: parseInt(formData.get('duration')),
                  type: formData.get('type'),
                  status: 'scheduled',
                  meetingLink: formData.get('type') === 'video' ? formData.get('meetingLink') : '',
                  location: formData.get('type') === 'in-person' ? formData.get('location') : '',
                  interviewer: formData.get('interviewer'),
                  notes: formData.get('notes'),
                  reminder: formData.get('reminder') === 'on',
                  candidateAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
                };
                setInterviews(prev => [...prev, newInterview]);
                setShowScheduleModal(false);
                toast.success('🎉 Interview scheduled successfully!');
              }} className="space-y-6 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                      👤 Candidate Name *
                    </label>
                    <input
                      type="text"
                      name="candidateName"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-purple-300"
                      placeholder="Enter candidate name"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                      📧 Candidate Email *
                    </label>
                    <input
                      type="email"
                      name="candidateEmail"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-blue-300"
                      placeholder="candidate@email.com"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-emerald-600 transition-colors">
                      💼 Job Title *
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emerald-300"
                      placeholder="e.g. Senior Developer"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                      👨‍💼 Interviewer *
                    </label>
                    <input
                      type="text"
                      name="interviewer"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-indigo-300"
                      placeholder="Interviewer name"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                      📅 Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-purple-300"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                      🕐 Time *
                    </label>
                    <input
                      type="time"
                      name="time"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-blue-300"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-emerald-600 transition-colors">
                      ⏱️ Duration (minutes) *
                    </label>
                    <select
                      name="duration"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emerald-300 cursor-pointer"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                      <option value="120">120 minutes</option>
                    </select>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                      🎯 Interview Type *
                    </label>
                    <select
                      name="type"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-indigo-300 cursor-pointer"
                      onChange={(e) => {
                        const meetingLinkField = document.querySelector('input[name="meetingLink"]');
                        const locationField = document.querySelector('input[name="location"]');
                        if (e.target.value === 'video') {
                          meetingLinkField.parentElement.style.display = 'block';
                          locationField.parentElement.style.display = 'none';
                        } else if (e.target.value === 'in-person') {
                          meetingLinkField.parentElement.style.display = 'none';
                          locationField.parentElement.style.display = 'block';
                        } else {
                          meetingLinkField.parentElement.style.display = 'none';
                          locationField.parentElement.style.display = 'none';
                        }
                      }}
                    >
                      <option value="video">📹 Video Call</option>
                      <option value="phone">📞 Phone Call</option>
                      <option value="in-person">🏢 In-Person</option>
                    </select>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                    🔗 Meeting Link
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-purple-300"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div style={{display: 'none'}} className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                    📍 Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-blue-300"
                    placeholder="Conference Room A, 10th Floor"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-emerald-600 transition-colors">
                    📝 Notes
                  </label>
                  <textarea
                    name="notes"
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-emerald-300 resize-none"
                    placeholder="Additional notes about the interview..."
                  ></textarea>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                  <input
                    type="checkbox"
                    name="reminder"
                    id="reminder"
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all duration-300"
                  />
                  <label htmlFor="reminder" className="ml-3 block text-sm font-medium text-gray-900">
                    🔔 Send reminder to candidate
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-8 py-3 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 hover:scale-105"
                  >
                    ❌ Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 border-0 rounded-xl hover:from-purple-600 hover:via-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl animate-gradient"
                  >
                    ✨ Schedule Interview
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;

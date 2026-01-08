import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Phone,
  Mail,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Glassmorphism utility classes
const glass = "backdrop-blur-md bg-white/30 border border-white/30 shadow-xl";

// Unique color palette (teal, violet, amber, emerald, gray)
const statusColors = {
  scheduled: 'bg-teal-100 text-teal-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  unknown: 'bg-gray-100 text-gray-800'
};

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load meetings from backend
  useEffect(() => {
    let timer;
    const loadMeetings = async () => {
      try {
        const res = await client.get('/api/jobseeker/interviews');
        if (res.data?.success) {
          const mapped = res.data.interviews.map(i => ({
            id: i.interview_id,
            title: i.job_title || 'Interview',
            company: i.company || 'Unknown Company',
            interviewer: i.recruiter_name || 'TBD',
            interviewerEmail: i.recruiter_email || '',
            interviewerRole: 'Recruiter',
            date: i.schedule ? new Date(i.schedule).toISOString().split('T')[0] : null, // Keep as ISO date string for calendar
            dateDisplay: i.schedule ? new Date(i.schedule).toLocaleDateString() : 'TBD', // For display purposes
            time: i.schedule ? new Date(i.schedule).toLocaleTimeString() : 'TBD',
            duration: i.duration ? `${i.duration} minutes` : '60 minutes',
            type: i.type || 'video',
            status: i.status || i.result || 'scheduled',
            meetingLink: i.meeting_link || '',
            location: i.location || '',
            notes: i.notes || '',
            agenda: ['Introduction', 'Technical Questions', 'Q&A'],
            // companyLogo removed - will use Avatar component
          }));
          setMeetings(mapped);
        }
      } catch (e) {
        console.error('Error loading meetings:', e);
      }
    };
    const start = async () => {
      setLoading(true);
      await loadMeetings();
      setLoading(false);
      timer = setInterval(loadMeetings, 30000);
    };
    start();
    return () => { if (timer) clearInterval(timer); };
  }, []);

  // Update interview status
  const updateInterviewStatus = async (interviewId, newStatus, notes = '') => {
    try {
      await client.put(`/api/jobseeker/interviews/${interviewId}/status`, {
        status: newStatus,
        notes: notes
      });
      
      // Update local state
      setMeetings(prev => prev.map(meeting => 
        meeting.id === interviewId 
          ? { ...meeting, status: newStatus, notes: notes || meeting.notes }
          : meeting
      ));
    } catch (error) {
      console.error('Error updating interview status:', error);
      toast.error('Failed to update interview status');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'scheduled':
        return {
          color: statusColors.scheduled,
          icon: <Calendar className="w-4 h-4" />,
          text: 'Scheduled'
        };
      case 'completed':
        return {
          color: statusColors.completed,
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Completed'
        };
      case 'cancelled':
        return {
          color: statusColors.cancelled,
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Cancelled'
        };
      default:
        return {
          color: statusColors.unknown,
          icon: <Clock className="w-4 h-4" />,
          text: 'Unknown'
        };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-violet-500 animate-pulse" />;
      case 'phone':
        return <Phone className="w-5 h-5 text-amber-500 animate-bounce" />;
      case 'in-person':
        return <MapPin className="w-5 h-5 text-emerald-500 animate-pulse" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Helper function to get local date string (YYYY-MM-DD) without timezone issues
    const getLocalDateStr = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const todayStr = getLocalDateStr(new Date());
    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = getLocalDateStr(currentDay);
      const dayInterviews = meetings.filter(meeting => {
        if (!meeting.date) return false;

        // Check if date is valid before processing
        const meetingDateObj = new Date(meeting.date);
        if (isNaN(meetingDateObj.getTime())) return false;

        const meetingDate = getLocalDateStr(meetingDateObj);
        const matchesDate = meetingDate === dateStr;

        return matchesDate;
      }).filter(meeting => {
        // Apply current filters
        const matchesFilter = filter === 'all' || meeting.status === filter;
        const matchesSearch = !searchTerm ||
          meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (meeting.interviewer && meeting.interviewer.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
      });

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

  const filteredMeetings = meetings.filter(meeting => {
    const matchesFilter = filter === 'all' || meeting.status === filter;
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.interviewer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingMeetings = meetings.filter(meeting => meeting.status === 'scheduled');
  const completedMeetings = meetings.filter(meeting => meeting.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-lg">
            <span className="bg-gradient-to-r from-teal-500 via-violet-500 to-amber-500 bg-clip-text text-transparent">
              Interviews & Meetings
            </span>
          </h1>
          <p className="text-gray-700 mt-1 font-medium">Manage your interview schedule and meeting notes</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all duration-200 bg-gradient-to-r from-violet-500 to-teal-400 text-white hover:scale-105 hover:from-teal-400 hover:to-violet-500 focus:ring-2 focus:ring-violet-300"
          >
            {viewMode === 'calendar' ? '📋 List View' : '📅 Calendar View'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`${glass} p-6 rounded-2xl transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center">
            <div className="p-3 bg-teal-200/60 rounded-xl shadow-inner">
              <Calendar className="w-7 h-7 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-teal-700">Upcoming</p>
              <p className="text-3xl font-extrabold text-gray-900">{upcomingMeetings.length}</p>
            </div>
          </div>
        </div>
        <div className={`${glass} p-6 rounded-2xl transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center">
            <div className="p-3 bg-emerald-200/60 rounded-xl shadow-inner">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-emerald-700">Completed</p>
              <p className="text-3xl font-extrabold text-gray-900">{completedMeetings.length}</p>
            </div>
          </div>
        </div>
        <div className={`${glass} p-6 rounded-2xl transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center">
            <div className="p-3 bg-violet-200/60 rounded-xl shadow-inner">
              <Users className="w-7 h-7 text-violet-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-violet-700">Companies</p>
              <p className="text-3xl font-extrabold text-gray-900">
                {new Set(meetings.map(m => m.company)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${glass} p-6 rounded-2xl`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full p-3 border-none rounded-xl bg-white/60 focus:ring-2 focus:ring-violet-400 font-medium shadow-inner transition"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-3 border-none rounded-xl bg-white/60 focus:ring-2 focus:ring-teal-400 font-medium shadow-inner transition"
          >
            <option value="all">All Meetings</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {/* Removed More Filters button */}
        </div>
      </div>

      {/* Next Meeting Alert */}
      {upcomingMeetings.length > 0 && (
        <div className={`${glass} border-l-8 border-teal-400 rounded-2xl p-5 animate-fade-in`}>
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-teal-500 animate-pulse" />
            <div className="ml-4">
              <h3 className="text-base font-bold text-teal-900">
                Next Interview: {upcomingMeetings[0].title}
              </h3>
              <p className="text-sm text-teal-700">
                {upcomingMeetings[0].dateDisplay} at {upcomingMeetings[0].time} with {upcomingMeetings[0].company}
              </p>
            </div>
            <div className="ml-auto">
              <button className="px-4 py-2 bg-gradient-to-r from-teal-400 to-violet-400 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition">
                Prepare Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meetings List / Calendar View */}
      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className={`${glass} rounded-2xl shadow-xl p-8`}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent">
              📅 {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-3 hover:bg-gradient-to-r hover:from-teal-500 hover:to-violet-500 hover:text-white rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-violet-500 text-white rounded-xl hover:from-teal-600 hover:to-violet-600 text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                ✨ Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-3 hover:bg-gradient-to-r hover:from-teal-500 hover:to-violet-500 hover:text-white rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center text-sm font-bold text-gray-700 bg-gradient-to-r from-teal-100 to-violet-100 rounded-xl">
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
                    ? 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-teal-300'
                    : 'bg-gray-100 border-gray-100 hover:border-gray-300'
                } ${day.isToday ? 'ring-4 ring-teal-500/30 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-300' : ''}`}
              >
                <div className={`text-sm font-bold mb-2 ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${day.isToday ? 'text-teal-600' : ''}`}>
                  {day.date.getDate()}
                  {day.isToday && ' 🌟'}
                </div>
                <div className="space-y-1">
                  {day.interviews.slice(0, 2).map((meeting, idx) => (
                    <div
                      key={meeting.id}
                      className={`text-xs p-2 rounded-lg truncate transition-all duration-300 hover:scale-105 cursor-pointer ${
                        meeting.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                        meeting.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                        'bg-gradient-to-r from-teal-500 to-violet-500 text-white'
                      }`}
                      title={`${meeting.time} - ${meeting.title} at ${meeting.company}`}
                      style={{
                        animationDelay: `${idx * 100}ms`,
                        animation: 'slideInUp 0.3s ease-out forwards'
                      }}
                    >
                      🕐 {meeting.time} {meeting.title}
                    </div>
                  ))}
                  {day.interviews.length > 2 && (
                    <div className="text-xs text-teal-600 font-semibold bg-teal-100 rounded-lg p-1 text-center">
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
        <div className="space-y-6">
          {filteredMeetings.map((meeting) => {
            const statusConfig = getStatusConfig(meeting.status);

            return (
              <div
                key={meeting.id}
                className={`${glass} rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 border-l-4 border-violet-300 hover:border-teal-400 animate-fade-in`}
              >
                <div className="p-7">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-5">
                      <Avatar
                        name={meeting.company}
                        size="xl"
                        className="rounded-xl border bg-gray-100 shadow"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {meeting.title}
                            </h3>
                            <p className="text-violet-700 font-semibold">{meeting.company}</p>
                            <p className="text-sm text-gray-600">
                              with {meeting.interviewer} • {meeting.interviewerRole}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${statusConfig.color} animate-fade-in`}>
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.text}</span>
                            </span>
                            {getTypeIcon(meeting.type)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-700">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {meeting.dateDisplay}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {meeting.time} ({meeting.duration})
                          </span>
                          {meeting.type === 'video' && meeting.meetingLink && (
                            <a
                              href={meeting.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-violet-600 hover:text-violet-900 font-semibold transition"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Join Meeting
                            </a>
                          )}
                          {meeting.type === 'in-person' && meeting.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {meeting.location.substring(0, 30)}...
                            </span>
                          )}
                        </div>

                        {meeting.notes && (
                          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-white/60 to-teal-100/40 shadow-inner">
                            <p className="text-sm text-gray-800">{meeting.notes}</p>
                          </div>
                        )}

                        {meeting.agenda && meeting.agenda.length > 0 && (
                          <div className="mt-5">
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Agenda</h4>
                            <div className="flex flex-wrap gap-2">
                              {meeting.agenda.map((item, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 shadow"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex space-x-2">
                            {meeting.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => {
                                    const notes = prompt('Add any notes about this interview:');
                                    if (notes !== null) {
                                      updateInterviewStatus(meeting.id, 'scheduled', notes);
                                    }
                                  }}
                                  className="text-violet-700 hover:text-violet-900 font-semibold text-sm transition"
                                >
                                  <Edit className="w-4 h-4 inline mr-1" />
                                  Add Notes
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Mark this interview as completed?')) {
                                      updateInterviewStatus(meeting.id, 'completed');
                                    }
                                  }}
                                  className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm transition"
                                >
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  Mark Complete
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Cancel this interview?')) {
                                      updateInterviewStatus(meeting.id, 'cancelled');
                                    }
                                  }}
                                  className="text-rose-600 hover:text-rose-800 font-semibold text-sm transition"
                                >
                                  <AlertCircle className="w-4 h-4 inline mr-1" />
                                  Cancel
                                </button>
                              </>
                            )}
                            {meeting.status === 'completed' && (
                              <button
                                onClick={() => {
                                  const notes = prompt('Add additional notes about this interview:', meeting.notes);
                                  if (notes !== null) {
                                    updateInterviewStatus(meeting.id, 'completed', notes);
                                  }
                                }}
                                className="text-violet-700 hover:text-violet-900 font-semibold text-sm transition"
                              >
                                <Edit className="w-4 h-4 inline mr-1" />
                                Add Notes
                              </button>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {meeting.meetingLink && meeting.status === 'scheduled' && (
                              <a
                                href={meeting.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gradient-to-r from-violet-400 to-teal-400 text-white rounded-xl font-semibold shadow hover:scale-105 transition"
                              >
                                <Video className="w-4 h-4 inline mr-2" />
                                Join Now
                              </a>
                            )}
                            <button className="text-rose-600 hover:text-rose-800 font-semibold text-sm transition">
                              <Trash2 className="w-4 h-4 inline mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredMeetings.length === 0 && (
        <div className={`${glass} text-center py-14 rounded-2xl shadow-xl animate-fade-in`}>
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No meetings found</h3>
          <p className="text-gray-700 mb-6">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search criteria or filters'
              : 'Your interview schedule will appear here'
            }
          </p>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </div>
  );
};

export default Meetings;

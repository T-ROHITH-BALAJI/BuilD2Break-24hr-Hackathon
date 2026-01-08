import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import JobSeekerProfile from './profiles/JobSeekerProfile';
import RecruiterProfile from './profiles/RecruiterProfile';
import AdminProfile from './profiles/AdminProfile';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {user.role === 'jobseeker' ? (
        <JobSeekerProfile user={user} />
      ) : user.role === 'recruiter' ? (
        <RecruiterProfile user={user} />
      ) : user.role === 'admin' ? (
        <AdminProfile user={user} />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Invalid user role</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

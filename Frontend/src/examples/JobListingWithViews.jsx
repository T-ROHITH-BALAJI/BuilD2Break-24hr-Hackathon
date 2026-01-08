import React from 'react';
import { Eye, MapPin, Briefcase, Calendar } from 'lucide-react';
import ViewCounter, { EnhancedViewCounter } from '../components/ViewCounter';
import { useAutoViewTracking } from '../hooks/useViewTracking';

// Example of how to integrate view tracking into job listings
const JobListingCard = ({ job, showViewTracking = true }) => {
  // Auto-track when user views this job for more than 3 seconds
  useAutoViewTracking('job', job.job_id, { 
    delay: 3000, // Track after 3 seconds of viewing
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      {/* Job Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
            {job.title}
          </h3>
          <p className="text-blue-600 font-medium mt-1">{job.company}</p>
        </div>
        
        {/* View Counter in top right */}
        {showViewTracking && (
          <div className="ml-4">
            <ViewCounter 
              entityType="job" 
              entityId={job.job_id}
              className="text-xs"
              showIcon={true}
            />
          </div>
        )}
      </div>

      {/* Job Details */}
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center">
          <Briefcase className="w-4 h-4 mr-1" />
          <span className="capitalize">{job.job_type}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{new Date(job.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Job Description Preview */}
      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
        {job.job_description}
      </p>

      {/* Salary and Enhanced View Counter */}
      <div className="flex items-center justify-between">
        <div>
          {job.salary && (
            <span className="text-lg font-semibold text-green-600">
              ${job.salary.toLocaleString()}/year
            </span>
          )}
        </div>
        
        {showViewTracking && (
          <EnhancedViewCounter 
            entityType="job" 
            entityId={job.job_id}
            showTrending={true}
            className="text-xs"
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Apply Now
        </button>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            ❤️
          </button>
          <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
            📤
          </button>
        </div>
      </div>
    </div>
  );
};

// Example of job listing grid with view tracking
const JobListingGrid = ({ jobs = [] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <JobListingCard 
          key={job.job_id} 
          job={job} 
          showViewTracking={true}
        />
      ))}
    </div>
  );
};

// Example of featured job with detailed stats
const FeaturedJobCard = ({ job }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mb-2">
            Featured Job 🌟
          </span>
          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
          <p className="text-blue-600 font-semibold text-lg">{job.company}</p>
        </div>
        
        {/* Enhanced View Stats */}
        <div className="text-right">
          <ViewCounter 
            entityType="job" 
            entityId={job.job_id}
            className="mb-2 justify-end"
          />
          <div className="text-xs text-gray-500">
            👀 Popular this week
          </div>
        </div>
      </div>

      {/* Auto-track this featured job view */}
      <AutoTrackView entityType="job" entityId={job.job_id} delay={2000} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Location</p>
          <p className="font-semibold text-gray-900">{job.location}</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Type</p>
          <p className="font-semibold text-gray-900 capitalize">{job.job_type}</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Experience</p>
          <p className="font-semibold text-gray-900">{job.min_experience}+ years</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Salary</p>
          <p className="font-semibold text-green-600">
            ${job.salary?.toLocaleString() || 'Negotiable'}
          </p>
        </div>
      </div>

      <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
        Apply for this Position →
      </button>
    </div>
  );
};

// Helper component to auto-track views
const AutoTrackView = ({ entityType, entityId, delay = 2000 }) => {
  useAutoViewTracking(entityType, entityId, { delay });
  return null; // This component doesn't render anything
};

export default JobListingCard;
export { JobListingGrid, FeaturedJobCard, AutoTrackView };
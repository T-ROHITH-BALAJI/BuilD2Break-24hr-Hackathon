import React from 'react';

const Avatar = ({ name, size = 'md', className = '', imageUrl = null }) => {
  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl'
  };

  // Generate a consistent color based on the name
  const getColorFromName = (name) => {
    if (!name) return 'from-gray-400 to-gray-600';
    
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-teal-400 to-teal-600',
      'from-cyan-400 to-cyan-600',
      'from-orange-400 to-orange-600',
      'from-lime-400 to-lime-600',
      'from-emerald-400 to-emerald-600',
      'from-violet-400 to-violet-600',
      'from-fuchsia-400 to-fuchsia-600',
      'from-rose-400 to-rose-600',
      'from-sky-400 to-sky-600',
      'from-amber-400 to-amber-600'
    ];
    
    // Generate a hash from the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    // Take first letter of first two words
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // If we have an image URL, use it
  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <img 
          src={imageUrl} 
          alt={name || 'User'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials instead
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Otherwise, show initials with gradient background
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-gradient-to-br ${getColorFromName(name)}
        flex items-center justify-center
        text-white font-bold
        shadow-lg
        ${className}
      `}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
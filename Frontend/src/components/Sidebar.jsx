import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Home,
    User,
    FileText,
    Search,
    Calendar,
    Briefcase,
    Users,
    PlusCircle,
    Mail,
    Settings,
    Activity,
    Shield,
    BarChart3,
    X,
    ChevronRight
} from 'lucide-react';

// All Tailwind and custom className removed

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    // Navigation items based on user role
    const getNavigationItems = () => {
        const baseItems = [
            {
                name: 'Dashboard',
                href: `/${user?.role}/dashboard`,
                icon: Home,
            },
        ];

        switch (user?.role) {
            case 'jobseeker':
                return [
                    ...baseItems,
                    {
                        name: 'Find Jobs',
                        href: '/jobseeker/jobs',
                        icon: Search,
                    },
                    {
                        name: 'My Resume',
                        href: '/jobseeker/resume',
                        icon: FileText,
                    },
                    {
                        name: 'Applications',
                        href: '/jobseeker/applications',
                        icon: Briefcase,
                    },
                    {
                        name: 'ATS Optimizer',
                        href: '/jobseeker/ats',
                        icon: BarChart3,
                    },
                    {
                        name: 'Meetings',
                        href: '/jobseeker/meetings',
                        icon: Calendar,
                    },
                ];

            case 'recruiter':
                return [
                    ...baseItems,
                    {
                        name: 'Post Job',
                        href: '/recruiter/post-job',
                        icon: PlusCircle,
                    },
                    {
                        name: 'Manage Jobs',
                        href: '/recruiter/jobs',
                        icon: Briefcase,
                    },
                    {
                        name: 'Applicants',
                        href: '/recruiter/applicants',
                        icon: Users,
                    },
                    {
                        name: 'Schedule',
                        href: '/recruiter/schedule',
                        icon: Calendar,
                    },
                ];

            case 'admin':
                return [
                    ...baseItems,
                    {
                        name: 'Manage Users',
                        href: '/admin/users',
                        icon: Users,
                    },
                    {
                        name: 'Recruiters',
                        href: '/admin/recruiters',
                        icon: Shield,
                    },
                    {
                        name: 'System Logs',
                        href: '/admin/logs',
                        icon: Activity,
                    },
                    {
                        name: 'Duplicates',
                        href: '/admin/duplicates',
                        icon: FileText,
                    },
                ];

            default:
                return baseItems;
        }
    };

    const navigationItems = getNavigationItems();

    const getRoleLabel = (role) => {
        switch (role) {
            case 'jobseeker':
                return 'Job Seeker';
            case 'recruiter':
                return 'Recruiter';
            case 'admin':
                return 'Administrator';
            default:
                return 'User';
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(75, 85, 99, 0.75)',
                        zIndex: 30,
                        display: 'block'
                    }}
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                style={{
                    position: 'fixed',
                    top: 64,
                    left: 0,
                    zIndex: 40,
                    height: 'calc(100vh - 4rem)',
                    width: 256,
                    background: '#1a202c',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.5s ease-out'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
                    {/* User info at top */}
                    <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: '#4f46e5',
                                    borderRadius: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}>
                                    <User size={24} color="#fff" />
                                </div>
                                <div style={{ marginLeft: 16 }}>
                                    <p style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', margin: 0 }}>
                                        {user?.name || 'User'} ✨
                                    </p>
                                    <p style={{ fontSize: 12, color: '#c4b5fd', margin: 0 }}>
                                        {getRoleLabel(user?.role)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: 8,
                                    borderRadius: 12,
                                    color: 'rgba(255,255,255,0.7)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'block'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav style={{ flex: 1, padding: 24, overflowY: 'auto', position: 'relative', zIndex: 10 }}>
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            onClose();
                                        }
                                    }}
                                >
                                    {({ isActive }) => (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            borderRadius: 16,
                                            marginBottom: 8,
                                            color: isActive ? '#fff' : '#c4b5fd',
                                            background: isActive ? 'rgba(255,255,255,0.08)' : 'none',
                                            textDecoration: 'none',
                                            boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                                            border: isActive ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                        }}>
                                            <Icon size={24} style={{ marginRight: 16 }} />
                                            <span>{item.name}</span>
                                            {isActive && <ChevronRight size={20} style={{ marginLeft: 'auto' }} />}
                                        </div>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Bottom section removed: Settings */}

                    {/* Version info */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 10 }}>
                        <p style={{ fontSize: 12, color: '#c4b5fd', textAlign: 'center', fontWeight: 500, margin: 0 }}>
                            ✨ JobPortal v1.0.0 ✨
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;

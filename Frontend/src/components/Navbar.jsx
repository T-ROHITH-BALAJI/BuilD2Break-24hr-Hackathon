import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import {
    Search,
    Menu,
    User,
    LogOut,
    ChevronDown
} from 'lucide-react';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const notifications = [];
    const unreadCount = 0;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <button
                        onClick={onToggleSidebar}
                        className="navbar-menu-btn"
                    >
                        <Menu />
                    </button>
                    <div className={`navbar-logo-mobile ${isSidebarOpen ? 'hidden' : ''}`}>
                        <h1>✨ JobPortal</h1>
                    </div>
                    <div className="navbar-search-desktop">
                        <div className="navbar-search-group">
                            <div className="navbar-search-icon">
                                <Search />
                            </div>
                            <input
                                type="text"
                                placeholder="🔍 Search jobs, candidates, or companies..."
                                className="navbar-search-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="navbar-right">
                    <button className="navbar-search-mobile-btn">
                        <Search />
                    </button>

                    {/* Notifications removed */}

                    <div className="navbar-profile" ref={dropdownRef}>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="navbar-profile-btn"
                        >
                            <div className="navbar-profile-avatar">
                                <User />
                            </div>
                            <span className="navbar-profile-name">
                                {user?.name || 'User'}
                            </span>
                            <ChevronDown />
                        </button>
                        {showProfileDropdown && (
                            <div className="navbar-profile-dropdown">
                                <div className="navbar-profile-header">
                                    <p>{user?.name}</p>
                                    <p>{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowProfileDropdown(false);
                                        const basePath = user?.role === 'jobseeker' ? '/jobseeker' : user?.role === 'recruiter' ? '/recruiter' : '/admin';
                                        navigate(`${basePath}/profile`);
                                    }}
                                    className="navbar-profile-item"
                                >
                                    <User className="navbar-profile-icon" />
                                    Profile
                                </button>
                                {/* Settings removed from dropdown */}
                                <div className="navbar-profile-divider"></div>
                                <button
                                    onClick={() => {
                                        setShowProfileDropdown(false);
                                        handleLogout();
                                    }}
                                    className="navbar-profile-item logout"
                                >
                                    <LogOut className="navbar-profile-icon" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showNotifications && (
                <div
                    className="navbar-overlay"
                    onClick={() => setShowNotifications(false)}
                />
            )}
            {showProfileDropdown && (
                <div
                    className="navbar-overlay"
                    onClick={() => setShowProfileDropdown(false)}
                />
            )}
        </nav>
    );
};

export default Navbar;

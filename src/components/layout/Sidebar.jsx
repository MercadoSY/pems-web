// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { auth } from '../../firebase/firebaseConfig';
import DownloadAppModal from '../modals/DownloadAppModal';

// Renders the main navigation sidebar for the application.
const Sidebar = ({ isExpanded, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false);

  // Handles user logout by signing out of Firebase and notifying other tabs.
  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log('User signed out from Firebase.');
    } catch (error) {
      console.error("Firebase signout failed", error);
      // Log the error, but proceed with client-side logout actions to ensure the user is redirected.
    } finally {
      // This event notifies other open tabs to also log out, ensuring session consistency.
      localStorage.setItem('pems-logout-event', Date.now().toString());

      // Navigate to login page. The root App component's auth listener will handle the state change.
      navigate('/login', { replace: true });
    }
  };

  const isActive = (path) => location.pathname === path;

  // Toggles the download app modal visibility.
  const handleDownloadAppClick = (e) => {
    e.preventDefault();
    setDownloadModalOpen(true);
  };

  return (
    <>
      <aside id="sidebar" className={`${styles.sidebar} ${isExpanded ? styles.expand : ''}`}>
        <div className="d-flex mt-2">
          <button className={styles.toggleBtn} type="button" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <i className="bi bi-grid-fill"></i>
          </button>
          <div className={styles.sidebarLogo}>
            <Link to="/dashboard">PEMS<span style={{ color: '#a2e089' }}>.</span></Link>
          </div>
        </div>
        <ul className={styles.sidebarNav}>
          <li className={`${styles.sidebarItem} ${isActive('/dashboard') ? styles.active : ''}`}>
            <Link to="/dashboard" className={styles.sidebarLink}>
              <i className="bi bi-house-door-fill"></i><span>Dashboard</span>
            </Link>
          </li>
          <li className={`${styles.sidebarItem} ${isActive('/analytics') ? styles.active : ''}`}>
            <Link to="/analytics" className={styles.sidebarLink}>
              <i className="bi bi-activity"></i><span>Analytics</span>
            </Link>
          </li>
          <li className={`${styles.sidebarItem} ${isActive('/workers') ? styles.active : ''}`}>
            <Link to="/workers" className={styles.sidebarLink}>
              <i className="bi bi-people-fill"></i><span>Workers</span>
            </Link>
          </li>
          <li className={`${styles.sidebarItem} ${isActive('/poultry-list') ? styles.active : ''}`}>
            <Link to="/poultry-list" className={styles.sidebarLink}>
              <i className="bi bi-houses-fill"></i><span>Poultry Houses</span>
            </Link>
          </li>
          <li className={`${styles.sidebarItem} ${isActive('/generate-report') ? styles.active : ''}`}>
            <Link to="/generate-report" className={styles.sidebarLink}>
              <i className="bi bi-pen-fill"></i><span>Generate Reports</span>
            </Link>
          </li>
          <li className={`${styles.sidebarItem} ${isActive('/order') ? styles.active : ''}`}>
            <Link to="/order" className={styles.sidebarLink}>
              <i className="bi bi-truck"></i><span>Order</span>
            </Link>
          </li>
          <li className={`${styles.sidebarItem} ${styles.utilitySectionStart}`}>
            <a href="#" onClick={handleDownloadAppClick} className={styles.sidebarLink}>
              <i className="bi bi-phone-fill"></i><span>Download App</span>
            </a>
          </li>
          <li className={`${styles.sidebarItem} ${isActive('/settings') ? styles.active : ''}`}>
            <Link to="/settings" className={styles.sidebarLink}>
              <i className="bi bi-gear-fill"></i><span>Settings</span>
            </Link>
          </li>
        </ul>
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <i className="bi bi-box-arrow-left"></i><span>Logout</span>
          </button>
        </div>
      </aside>
      <DownloadAppModal isOpen={isDownloadModalOpen} onClose={() => setDownloadModalOpen(false)} />
    </>
  );
};

export default Sidebar;
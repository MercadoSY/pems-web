// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import NotificationModal from '../components/modals/NotificationModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import ChangeEmailModal from '../components/modals/ChangeEmailModal';
import ChangeNameModal from '../components/modals/ChangeNameModal';
import { fetchRegisterKey, updateRegisterKey, fetchAdminDetails, updateAdminName } from '../firebase/userManagement';
import { changeUserPassword, changeUserEmail } from '../firebase/authentication';
import styles from '../styles/SettingsPage.module.css';
import { getAuth, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';


// Renders the settings page for UI and account customization.
const SettingsPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [uiSize, setUiSize] = useState(localStorage.getItem('uiSize') || 100);
  const [tempUnit, setTempUnit] = useState(localStorage.getItem('tempUnit') || 'C');

  const [registerKey, setRegisterKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info', title: '' });
  
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [isChangeNameModalOpen, setIsChangeNameModalOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  const navigate = useNavigate();

  // Applies UI size changes and persists them to local storage.
  useEffect(() => {
    document.documentElement.style.fontSize = `${uiSize}%`;
    localStorage.setItem('uiSize', uiSize);
  }, [uiSize]);

  // Fetches initial data when a user is authenticated.
  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
            loadRegisterKey();
            try {
              const adminDetails = await fetchAdminDetails(user.email);
              if (adminDetails && adminDetails.name) {
                  setCurrentUserName(adminDetails.name);
              }
            } catch (error) {
                console.error("Failed to fetch admin details:", error);
            }
        } else {
            console.warn("No user signed in; cannot fetch register key.");
        }
    });
    return () => unsubscribe();
  }, []);

  // Loads the register key from Firestore.
  const loadRegisterKey = async () => {
      try {
          const key = await fetchRegisterKey();
          setRegisterKey(key);
      } catch (error) {
          console.error("Failed to fetch register key:", error);
          setNotification({
              isOpen: true,
              title: "Error",
              message: "Could not load the register key.",
              type: "error",
          });
      }
  };

  // Handles UI size slider changes.
  const handleUiSizeChange = (e) => setUiSize(e.target.value);

  // Handles temperature unit changes and notifies other parts of the app.
  const handleTempUnitChange = (e) => {
    const newUnit = e.target.value;
    setTempUnit(newUnit);
    localStorage.setItem('tempUnit', newUnit);
    window.dispatchEvent(new StorageEvent('storage', { key: 'tempUnit', newValue: newUnit }));
    console.log(`Temperature unit changed to ${newUnit}`);
  };

  // Handles the submission of a new mobile app register key.
  const handleUpdateKey = async (e) => {
    e.preventDefault();
    setIsUpdatingKey(true);
    try {
        await updateRegisterKey(registerKey);
        console.log("Register key updated successfully.");
        setNotification({
            isOpen: true,
            title: "Success",
            message: "Register key updated successfully.",
            type: "success",
        });
    } catch (error) {
        console.error("Failed to update register key:", error);
        setNotification({
            isOpen: true,
            title: "Update Failed",
            message: error.message || "An unexpected error occurred.",
            type: "error",
        });
    } finally {
        setIsUpdatingKey(false);
    }
  };

  // Handles the password change submission.
  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
        await changeUserPassword(currentPassword, newPassword);
        console.log("User password changed successfully.");
        setNotification({
            isOpen: true,
            title: "Success",
            message: "Your password has been changed successfully.",
            type: "success",
        });
        setIsChangePasswordModalOpen(false);
    } catch (error) {
        console.error("Failed to change password:", error);
        // Re-throwing allows the modal's own error handler to catch and display it.
        throw error;
    }
  };

  // Handles the name change submission.
  const handleNameChange = async (newName, currentPassword) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in to perform this action.");

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updateAdminName(user.email, newName);
      
      setCurrentUserName(newName);
      setIsChangeNameModalOpen(false);
      setNotification({
        isOpen: true,
        title: "Success",
        message: "Your name has been updated successfully.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to change name:", error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('The password you entered is incorrect.');
      }
      throw error;
    }
  };

  // Handles the email change submission and subsequent auto-logout.
  const handleEmailChange = async (currentPassword, newEmail, verificationCode) => {
    try {
        const result = await changeUserEmail(currentPassword, newEmail, verificationCode);
        console.log("User email changed successfully. Initiating auto-logout.");
        setIsChangeEmailModalOpen(false);
        setNotification({
            isOpen: true,
            title: "Success",
            message: result.message + " You will be logged out automatically in 5 seconds.",
            type: "success",
        });
        
        // Auto-logout after a delay to allow the user to read the success message.
        setTimeout(() => {
            auth.signOut().catch(error => {
                // Log the error but proceed with client-side cleanup
                console.error("Firebase signout failed after email change:", error);
            }).finally(() => {
                // The auth state listener in App.jsx will handle UI changes.
                // This event ensures other tabs are also logged out.
                localStorage.setItem('pems-logout-event', Date.now().toString());
                
                console.log("Forcing navigation to login page after email change.");
                navigate('/login', { replace: true });
            });
        }, 5000);

    } catch (error) {
        console.error("Failed to change email:", error);
        throw error; // Re-throw for modal's error handler
    }
  };
  
  // Closes the notification modal.
  const handleCloseNotification = () => {
    setNotification({ isOpen: false, message: '', type: 'info', title: '' });
  };

  // Toggles the sidebar's expanded state.
  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  return (
    <div className="d-flex">
      <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
      <main className={styles.mainContent} style={{ marginLeft: isSidebarExpanded ? '260px' : '70px' }}>
        <div className="container-fluid py-3">
          <div className={`${styles.pageHeader} mb-4`}>
            <h1><i className="bi bi-gear-fill"></i>Settings</h1>
            <p className={`${styles.textMuted} mb-0`}>Customize your application preferences</p>
          </div>

          <div className={`${styles.card} ${styles.appearanceCard} mb-4`}>
            <div className={styles.cardHeader}><h5 className="mb-0"><i className="bi bi-palette-fill"></i>Appearance</h5></div>
            <div className={styles.cardBody}>
              <div className={styles.settingItem}>
                <label htmlFor="uiSizeSlider" className={`form-label ${styles.formLabel}`}>Overall UI Size: <strong>{uiSize}%</strong></label>
                <div className={styles.sliderContainer}>
                  <span>50%</span>
                  <input type="range" className="form-range" id="uiSizeSlider" min="50" max="150" step="5" value={uiSize} onChange={handleUiSizeChange} />
                  <span>150%</span>
                </div>
                <small className="form-text text-muted">Adjusts text and element sizes. (Default: 100%)</small>
              </div>
            </div>
          </div>
          
          <div className={`${styles.card} ${styles.unitsCard} mb-4`}>
            <div className={styles.cardHeader}><h5 className="mb-0"><i className="bi bi-rulers"></i>Units</h5></div>
            <div className={styles.cardBody}>
              <div className={styles.settingItem}>
                <label className={`form-label ${styles.formLabel}`}>Temperature Unit</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="tempUnit" id="celsius" value="C" checked={tempUnit === 'C'} onChange={handleTempUnitChange} />
                    <label className="form-check-label" htmlFor="celsius">Celsius (°C)</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="tempUnit" id="fahrenheit" value="F" checked={tempUnit === 'F'} onChange={handleTempUnitChange} />
                    <label className="form-check-label" htmlFor="fahrenheit">Fahrenheit (°F)</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.securityCard} mb-4`}>
            <div className={styles.cardHeader}><h5 className="mb-0"><i className="bi bi-shield-lock-fill"></i>Security</h5></div>
            <div className={styles.cardBody}>
              <form onSubmit={handleUpdateKey}>
                  <div className={styles.settingItem}>
                      <label htmlFor="registerKeyInput" className={`form-label ${styles.formLabel}`}>Mobile App Register Key</label>
                      <div className="input-group mb-2" style={{maxWidth: '500px'}}>
                          <input
                              type={isKeyVisible ? 'text' : 'password'}
                              className="form-control"
                              id="registerKeyInput"
                              value={registerKey}
                              onChange={(e) => setRegisterKey(e.target.value)}
                              placeholder="Enter a secret key"
                              aria-describedby="key-toggle-button"
                              minLength="8"
                          />
                          <button
                              className="btn btn-outline-secondary"
                              type="button"
                              id="key-toggle-button"
                              onClick={() => setIsKeyVisible(!isKeyVisible)}
                          >
                              <i className={`bi ${isKeyVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                      </div>
                      <small className="form-text text-muted">
                          This key is required for workers to register via the mobile app. It prevents unauthorized registrations if the app link is shared publicly.
                      </small>
                  </div>
                  <button type="submit" className={`btn btn-primary ${styles.actionButton}`} disabled={isUpdatingKey}>
                      {isUpdatingKey ? 'Saving...' : 'Save Key'}
                  </button>
              </form>
            </div>
          </div>

          <div className={`${styles.card} ${styles.accountCard} mb-4`}>
            <div className={styles.cardHeader}><h5 className="mb-0"><i className="bi bi-person-circle"></i>Account</h5></div>
            <div className={styles.cardBody}>
              <div className={styles.settingItem}>
                  <label className={`form-label ${styles.formLabel}`}>Name ({currentUserName || '...'})</label>
                  <button className={`btn btn-outline-secondary ${styles.actionButton}`} onClick={() => setIsChangeNameModalOpen(true)} disabled={!currentUserName}>
                      Change Name
                  </button>
              </div>
              <div className={styles.settingItem}>
                <label className={`form-label ${styles.formLabel}`}>Password</label>
                <button className={`btn btn-outline-secondary ${styles.actionButton}`} onClick={() => setIsChangePasswordModalOpen(true)}>Change Password</button>
              </div>
              <div className={styles.settingItem}>
                <label className={`form-label ${styles.formLabel}`}>Email</label>
                <button className={`btn btn-outline-secondary ${styles.actionButton}`} onClick={() => setIsChangeEmailModalOpen(true)}>Change Email Address</button>
              </div>
            </div>
          </div>

        </div>
      </main>
      <NotificationModal {...notification} onClose={handleCloseNotification} />
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
      <ChangeNameModal
        isOpen={isChangeNameModalOpen}
        onClose={() => setIsChangeNameModalOpen(false)}
        onSubmit={handleNameChange}
        currentName={currentUserName}
      />
      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onClose={() => setIsChangeEmailModalOpen(false)}
        onSubmit={handleEmailChange}
      />
    </div>
  );
};

export default SettingsPage;